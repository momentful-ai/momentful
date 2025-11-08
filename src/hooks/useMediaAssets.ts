import { useQuery } from '@tanstack/react-query';
import { database } from '../lib/database';
import { MediaAsset } from '../types';

export function useMediaAssets(projectId: string, options?: { enabled?: boolean }) {
  return useQuery<MediaAsset[]>({
    queryKey: ['media-assets', projectId],
    queryFn: () => database.mediaAssets.list(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache for 24 hours
    refetchOnWindowFocus: false, // Don't refetch on window focus (staleTime handles freshness)
    enabled: options?.enabled !== false && !!projectId,
  });
}
