import { useQuery } from '@tanstack/react-query';
import { GeneratedVideo } from '../types';
import { database } from '../lib/database';
import { useUserId } from './useUserId';
import { isDemoMode } from '../lib/demo-mode';
import { MOCK_GENERATED_VIDEOS } from '../lib/dev-mock-data';

export function useGeneratedVideos(projectId: string, options?: { enabled?: boolean }) {
  const userId = useUserId();
  const demoMode = isDemoMode();

  return useQuery<GeneratedVideo[]>({
    queryKey: ['generated-videos', projectId, userId, demoMode],
    queryFn: async () => {
      // In demo mode, return mock data immediately without Supabase calls
      if (demoMode) {
        return MOCK_GENERATED_VIDEOS;
      }
      if (!userId) throw new Error('User not authenticated');
      return database.generatedVideos.list(projectId, userId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: options?.enabled !== false && (!!userId || demoMode),
  });
}
