import { useMutation, useQueryClient } from '@tanstack/react-query';
import { database } from '../lib/database';
import { Lineage } from '../types';

interface UpdateLineageParams {
  lineageId: string;
  name: string;
  projectId: string;
}

export function useUpdateLineage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lineageId, name }: UpdateLineageParams) => {
      // Convert empty string to undefined to remove the name
      return await database.lineages.update(lineageId, { 
        name: name.trim() || undefined 
      });
    },
    onMutate: async ({ lineageId, name, projectId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['timelines', projectId] });

      // Snapshot the previous value
      const previousLineages = queryClient.getQueryData<Lineage[]>(['timelines', projectId]);

      // Optimistically update to the new value
      if (previousLineages) {
        const trimmedName = name.trim() || undefined;
        queryClient.setQueryData<Lineage[]>(['timelines', projectId], (old) =>
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
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousLineages) {
        queryClient.setQueryData(['timelines', variables.projectId], context.previousLineages);
      }
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['timelines', variables.projectId] });
    },
  });
}

