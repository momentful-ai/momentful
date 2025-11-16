import { useMutation, useQueryClient } from '@tanstack/react-query';
import { database } from '../lib/database';
import { EditedImage } from '../types';
import { useUserId } from './useUserId';

interface DeleteEditedImageParams {
  imageId: string;
  storagePath: string;
  projectId: string;
}

export function useDeleteEditedImage() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ imageId, storagePath }: DeleteEditedImageParams) => {
      if (!userId) throw new Error('User not authenticated');
      // Delete from storage first
      await database.storage.delete('user-uploads', [storagePath]);
      // Delete from database
      await database.editedImages.delete(imageId, userId);

      return { imageId };
    },
    onMutate: async ({ imageId, projectId }) => {
      if (!userId) return;
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['edited-images', projectId, userId] });

      // Snapshot the previous value
      const previousImages = queryClient.getQueryData<EditedImage[]>(['edited-images', projectId, userId]);

      // Optimistically update to the new value
      if (previousImages) {
        queryClient.setQueryData<EditedImage[]>(['edited-images', projectId, userId], (old) =>
          old?.filter(image => image.id !== imageId) ?? []
        );
      }

      // Return a context object with the snapshotted value
      return { previousImages };
    },
    onError: (_err, variables, context) => {
      if (!userId) return;
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousImages) {
        queryClient.setQueryData(['edited-images', variables.projectId, userId], context.previousImages);
      }
    },
    onSettled: (_data, _error, variables) => {
      if (!userId) return;
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['edited-images', variables.projectId, userId] });
    },
  });
}

