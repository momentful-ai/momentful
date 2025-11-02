import { useMutation, useQueryClient } from '@tanstack/react-query';
import { database } from '../lib/database';
import { EditedImage } from '../types';

interface DeleteEditedImageParams {
  imageId: string;
  storagePath: string;
  projectId: string;
}

export function useDeleteEditedImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ imageId, storagePath }: DeleteEditedImageParams) => {
      // Delete from storage first
      await database.storage.delete('user-uploads', [storagePath]);
      // Delete from database
      await database.editedImages.delete(imageId);

      return { imageId };
    },
    onMutate: async ({ imageId, projectId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['edited-images', projectId] });

      // Snapshot the previous value
      const previousImages = queryClient.getQueryData<EditedImage[]>(['edited-images', projectId]);

      // Optimistically update to the new value
      if (previousImages) {
        queryClient.setQueryData<EditedImage[]>(['edited-images', projectId], (old) =>
          old?.filter(image => image.id !== imageId) ?? []
        );
      }

      // Return a context object with the snapshotted value
      return { previousImages };
    },
    onError: (_err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousImages) {
        queryClient.setQueryData(['edited-images', variables.projectId], context.previousImages);
      }
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['edited-images', variables.projectId] });
    },
  });
}

