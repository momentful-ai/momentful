import { useMutation, useQueryClient } from '@tanstack/react-query';
import { database } from '../lib/database';
import { GeneratedVideo } from '../types';

interface DeleteGeneratedVideoParams {
  videoId: string;
  storagePath?: string;
  projectId: string;
}

export function useDeleteGeneratedVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, storagePath }: DeleteGeneratedVideoParams) => {
      // Delete from storage if storage_path exists and is a local path (not external URL)
      if (storagePath && !storagePath.startsWith('http')) {
        await database.storage.delete('user-uploads', [storagePath]);
      }
      // Delete from database
      await database.generatedVideos.delete(videoId);

      return { videoId };
    },
    onMutate: async ({ videoId, projectId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['generated-videos', projectId] });

      // Snapshot the previous value
      const previousVideos = queryClient.getQueryData<GeneratedVideo[]>(['generated-videos', projectId]);

      // Optimistically update to the new value
      if (previousVideos) {
        queryClient.setQueryData<GeneratedVideo[]>(['generated-videos', projectId], (old) =>
          old?.filter(video => video.id !== videoId) ?? []
        );
      }

      // Return a context object with the snapshotted value
      return { previousVideos };
    },
    onError: (_err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousVideos) {
        queryClient.setQueryData(['generated-videos', variables.projectId], context.previousVideos);
      }
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['generated-videos', variables.projectId] });
    },
  });
}

