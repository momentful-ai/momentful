import { useMutation, useQueryClient } from '@tanstack/react-query';
import { database } from '../lib/database';
import { getImageDimensions, isAcceptableImageFile } from '../lib/media';
import { useUserId } from './useUserId';

interface UploadMediaParams {
  projectId: string;
  files: File[];
}

export function useUploadMedia() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, files }: UploadMediaParams) => {
      const imageFiles = files.filter(isAcceptableImageFile);

      if (imageFiles.length === 0) {
        throw new Error('Please upload valid image files');
      }

      const uploadPromises = imageFiles.map(async (file) => {
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name}`;
        const storagePath = `${projectId}/${fileName}`;

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
      });

      const results = await Promise.allSettled(uploadPromises);

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      if (failed > 0) {
        throw new Error(`Failed to upload ${failed} files`);
      }

      return { successful, total: files.length };
    },
    onSuccess: ({ successful }, { projectId }) => {
      // Invalidate and refetch media assets
      queryClient.invalidateQueries({
        queryKey: ['media-assets', projectId],
      });
    },
  });
}
