import { useQuery } from '@tanstack/react-query';
import { database } from '../lib/database';
import { GeneratedVideo } from '../types';

export function useGeneratedVideos(projectId: string, options?: { enabled?: boolean }) {
  return useQuery<GeneratedVideo[]>({
    queryKey: ['generated-videos', projectId],
    queryFn: () => database.generatedVideos.list(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: options?.enabled !== false,
  });
}

