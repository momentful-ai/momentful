import { useMutation, useQueryClient } from '@tanstack/react-query';
import { database } from '../lib/database';
import { MediaAsset } from '../types';

interface DeleteMediaAssetParams {
  assetId: string;
  storagePath: string;
  projectId: string;
}

export function useDeleteMediaAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assetId, storagePath }: DeleteMediaAssetParams) => {
      // Delete from storage first
      await database.storage.delete('user-uploads', [storagePath]);
      // Delete from database
      await database.mediaAssets.delete(assetId);

      return { assetId };
    },
    onMutate: async ({ assetId, projectId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['media-assets', projectId] });

      // Snapshot the previous value
      const previousAssets = queryClient.getQueryData<MediaAsset[]>(['media-assets', projectId]);

      // Optimistically update to the new value
      if (previousAssets) {
        queryClient.setQueryData<MediaAsset[]>(['media-assets', projectId], (old) =>
          old?.filter(asset => asset.id !== assetId) ?? []
        );
      }

      // Return a context object with the snapshotted value
      return { previousAssets };
    },
    onError: (_err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousAssets) {
        queryClient.setQueryData(['media-assets', variables.projectId], context.previousAssets);
      }
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['media-assets', variables.projectId] });
    },
  });
}
