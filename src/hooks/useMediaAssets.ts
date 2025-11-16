import { useQuery } from '@tanstack/react-query';
import { database } from '../lib/database';
import { MediaAsset } from '../types';
import { useUserId } from './useUserId';

export function useMediaAssets(projectId: string, options?: { enabled?: boolean }) {
  const userId = useUserId();
  return useQuery<MediaAsset[]>({
    queryKey: ['media-assets', projectId, userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return database.mediaAssets.list(projectId, userId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache for 24 hours
    refetchOnWindowFocus: false, // Don't refetch on window focus (staleTime handles freshness)
    enabled: options?.enabled !== false && !!projectId && !!userId,
  });
}
