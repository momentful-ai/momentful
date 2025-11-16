import { useMutation, useQueryClient } from '@tanstack/react-query';
import { database } from '../lib/database';
import { Lineage } from '../types';
import { useUserId } from './useUserId';

interface UpdateLineageParams {
  lineageId: string;
  name: string;
  projectId: string;
}

export function useUpdateLineage() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ lineageId, name }: UpdateLineageParams) => {
      if (!userId) throw new Error('User not authenticated');
      // Convert empty string to undefined to remove the name
      return await database.lineages.update(lineageId, userId, {
        name: name.trim() || undefined
      });
    },
    onMutate: async ({ lineageId, name, projectId }) => {
      if (!userId) return;
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['timelines', projectId, userId] });

      // Snapshot the previous value
      const previousLineages = queryClient.getQueryData<Lineage[]>(['timelines', projectId, userId]);

      // Optimistically update to the new value
      if (previousLineages) {
        const trimmedName = name.trim() || undefined;
        queryClient.setQueryData<Lineage[]>(['timelines', projectId, userId], (old) =>
          old?.map(lineage =>
            lineage.id === lineageId
              ? { ...lineage, name: trimmedName }
              : lineage
          ) ?? []
        );
      }

      // Return a context object with the snapshotted value
      return { previousLineages };
    },
    onError: (_err, variables, context) => {
      if (!userId) return;
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousLineages) {
        queryClient.setQueryData(['timelines', variables.projectId, userId], context.previousLineages);
      }
    },
    onSettled: (_data, _error, variables) => {
      if (!userId) return;
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['timelines', variables.projectId, userId] });
    },
  });
}

