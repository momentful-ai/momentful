import { useQuery } from '@tanstack/react-query';
import { database } from '../lib/database';
import { MediaAsset } from '../types';

export function useMediaAssets(projectId: string) {
  return useQuery<MediaAsset[]>({
    queryKey: ['media-assets', projectId],
    queryFn: () => database.mediaAssets.list(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
