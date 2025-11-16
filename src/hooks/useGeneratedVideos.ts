import { useQuery } from '@tanstack/react-query';
import { database } from '../lib/database';
import { GeneratedVideo } from '../types';
import { useUserId } from './useUserId';

export function useGeneratedVideos(projectId: string, options?: { enabled?: boolean }) {
  const userId = useUserId();
  return useQuery<GeneratedVideo[]>({
    queryKey: ['generated-videos', projectId, userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return database.generatedVideos.list(projectId, userId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: options?.enabled !== false && !!userId,
  });
}

