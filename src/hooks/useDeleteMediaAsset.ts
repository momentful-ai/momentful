import { useMutation, useQueryClient } from '@tanstack/react-query';
import { database } from '../lib/database';
import { MediaAsset } from '../types';
import { useUserId } from './useUserId';

interface DeleteMediaAssetParams {
  assetId: string;
  storagePath: string;
  projectId: string;
}

export function useDeleteMediaAsset() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ assetId, storagePath }: DeleteMediaAssetParams) => {
      if (!userId) throw new Error('User not authenticated');
      // Delete from storage first
      await database.storage.delete('user-uploads', [storagePath]);
      // Delete from database
      await database.mediaAssets.delete(assetId, userId);

      return { assetId };
    },
    onMutate: async ({ assetId, projectId }) => {
      if (!userId) return;
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['media-assets', projectId, userId] });

      // Snapshot the previous value
      const previousAssets = queryClient.getQueryData<MediaAsset[]>(['media-assets', projectId, userId]);

      // Optimistically update to the new value
      if (previousAssets) {
        queryClient.setQueryData<MediaAsset[]>(['media-assets', projectId, userId], (old) =>
          old?.filter(asset => asset.id !== assetId) ?? []
        );
      }

      // Return a context object with the snapshotted value
      return { previousAssets };
    },
    onError: (_err, variables, context) => {
      if (!userId) return;
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousAssets) {
        queryClient.setQueryData(['media-assets', variables.projectId, userId], context.previousAssets);
      }
    },
    onSettled: (_data, _error, variables) => {
      if (!userId) return;
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['media-assets', variables.projectId, userId] });
    },
  });
}
