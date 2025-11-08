import { useQuery } from '@tanstack/react-query';
import { database } from '../lib/database';
import { EditedImage } from '../types';

export function useEditedImages(projectId: string, options?: { enabled?: boolean }) {
  return useQuery<EditedImage[]>({
    queryKey: ['edited-images', projectId],
    queryFn: () => database.editedImages.list(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache for 24 hours
    refetchOnWindowFocus: false, // Don't refetch on window focus (staleTime handles freshness)
    enabled: options?.enabled !== false && !!projectId,
  });
}


export function useEditedImagesByLineage(lineageId: string | null, options?: { enabled?: boolean }) {
  return useQuery<EditedImage[]>({
    queryKey: ['edited-images', 'lineage', lineageId],
    queryFn: () => {
      if (!lineageId) {
        return Promise.resolve([]);
      }
      return database.editedImages.listByLineage(lineageId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache for 24 hours
    refetchOnWindowFocus: false, // Don't refetch on window focus (staleTime handles freshness)
    enabled: options?.enabled !== false && lineageId !== null && lineageId !== '' && lineageId !== undefined,
  });
}

