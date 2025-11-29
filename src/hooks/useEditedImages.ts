import { useQuery } from '@tanstack/react-query';
import { EditedImage } from '../types';
import { database } from '../lib/database';
import { useUserId } from './useUserId';
import { isDemoMode } from '../lib/demo-mode';
import { MOCK_EDITED_IMAGES } from '../lib/dev-mock-data';

export function useEditedImages(projectId: string, options?: { enabled?: boolean }) {
  const userId = useUserId();
  const demoMode = isDemoMode();

  return useQuery<EditedImage[]>({
    queryKey: ['edited-images', projectId, userId, demoMode],
    queryFn: async () => {
      // In demo mode, return mock data immediately without Supabase calls
      if (demoMode) {
        return MOCK_EDITED_IMAGES;
      }
      if (!userId) throw new Error('User not authenticated');
      return database.editedImages.list(projectId, userId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache for 24 hours
    refetchOnWindowFocus: false, // Don't refetch on window focus (staleTime handles freshness)
    enabled: options?.enabled !== false && (!!userId || demoMode),
  });
}

