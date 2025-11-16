import { useMutation, useQueryClient } from '@tanstack/react-query';
import { database } from '../lib/database';
import { GeneratedVideo } from '../types';
import { useUserId } from './useUserId';

interface DeleteGeneratedVideoParams {
  videoId: string;
  storagePath?: string;
  projectId: string;
}

export function useDeleteGeneratedVideo() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ videoId, storagePath }: DeleteGeneratedVideoParams) => {
      if (!userId) throw new Error('User not authenticated');
      // Delete from storage if storage_path exists and is a local path (not external URL)
      if (storagePath && !storagePath.startsWith('http')) {
        await database.storage.delete('user-uploads', [storagePath]);
      }
      // Delete from database
      await database.generatedVideos.delete(videoId, userId);

      return { videoId };
    },
    onMutate: async ({ videoId, projectId }) => {
      if (!userId) return;
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['generated-videos', projectId, userId] });

      // Snapshot the previous value
      const previousVideos = queryClient.getQueryData<GeneratedVideo[]>(['generated-videos', projectId, userId]);

      // Optimistically update to the new value
      if (previousVideos) {
        queryClient.setQueryData<GeneratedVideo[]>(['generated-videos', projectId, userId], (old) =>
          old?.filter(video => video.id !== videoId) ?? []
        );
      }

      // Return a context object with the snapshotted value
      return { previousVideos };
    },
    onError: (_err, variables, context) => {
      if (!userId) return;
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousVideos) {
        queryClient.setQueryData(['generated-videos', variables.projectId, userId], context.previousVideos);
      }
    },
    onSettled: (_data, _error, variables) => {
      if (!userId) return;
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['generated-videos', variables.projectId, userId] });
    },
  });
}

