import { useQuery } from '@tanstack/react-query';
import { database } from '../lib/database';
import { EditedImage } from '../types';
import { useUserId } from './useUserId';

export function useEditedImages(projectId: string, options?: { enabled?: boolean }) {
  const userId = useUserId();
  return useQuery<EditedImage[]>({
    queryKey: ['edited-images', projectId, userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return database.editedImages.list(projectId, userId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache for 24 hours
    refetchOnWindowFocus: false, // Don't refetch on window focus (staleTime handles freshness)
    enabled: options?.enabled !== false && !!projectId && !!userId,
  });
}


export function useEditedImagesByLineage(lineageId: string | null, options?: { enabled?: boolean }) {
  const userId = useUserId();
  return useQuery<EditedImage[]>({
    queryKey: ['edited-images', 'lineage', lineageId, userId],
    queryFn: () => {
      if (!lineageId) {
        return Promise.resolve([]);
      }
      if (!userId) throw new Error('User not authenticated');
      return database.editedImages.listByLineage(lineageId, userId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache for 24 hours
    refetchOnWindowFocus: false, // Don't refetch on window focus (staleTime handles freshness)
    enabled: options?.enabled !== false && lineageId !== null && lineageId !== '' && lineageId !== undefined && !!userId,
  });
}

