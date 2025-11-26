import { useMutation, useQueryClient } from '@tanstack/react-query';
import { database } from '../lib/database';
import { getImageDimensions, isAcceptableImageFile } from '../lib/media';
import { useUserId } from './useUserId';
import { handleStorageError, validateStoragePath } from '../lib/storage-utils';

interface UploadMediaParams {
  projectId: string;
  files: File[];
}

export function useUploadMedia() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, files }: UploadMediaParams) => {
      // Ensure user is authenticated
      if (!userId) {
        throw new Error('You must be logged in to upload files');
      }

      const imageFiles = files.filter(isAcceptableImageFile);

      if (imageFiles.length === 0) {
        throw new Error('Please upload valid image files');
      }

      const uploadPromises = imageFiles.map(async (file) => {
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name}`;
        const storagePath = `${userId}/${projectId}/${fileName}`;

        // Validate storage path
        const pathValidation = validateStoragePath(userId || '', storagePath);
        if (!pathValidation.valid) {
          throw new Error(`Storage path validation failed: ${pathValidation.error}`);
        }

        try {
          // Upload file to storage
          await database.storage.upload('user-uploads', storagePath, file);

          // Get image dimensions
          const { width, height } = await getImageDimensions(file);

          // Create database record
          await database.mediaAssets.create({
            project_id: projectId,
            user_id: userId,
            file_name: file.name,
            file_type: 'image',
            file_size: file.size,
            storage_path: storagePath,
            width,
            height,
          });

          return { success: true, fileName: file.name };
        } catch (error) {
          // Handle storage errors gracefully
          const errorResult = handleStorageError(error, 'upload');
          throw new Error(errorResult.error);
        }
      });

      const results = await Promise.allSettled(uploadPromises);

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      if (failed > 0) {
        throw new Error(`Failed to upload ${failed} files`);
      }

      return { successful, total: files.length };
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSuccess: ({ successful: _successful }, { projectId }) => {
      // Invalidate and refetch media assets
      queryClient.invalidateQueries({
        queryKey: ['media-assets', projectId, userId],
      });
      // Invalidate project lookup so previewImages picks up the new upload
      queryClient.invalidateQueries({
        queryKey: ['projects', userId],
      });
      // Invalidate thumbnail cache for new uploads
      queryClient.invalidateQueries({ queryKey: ['signed-url'] });
      // Dispatch custom event to trigger global thumbnail prefetch refresh
      window.dispatchEvent(new CustomEvent('thumbnail-cache-invalidated'));
    },
  });
}
