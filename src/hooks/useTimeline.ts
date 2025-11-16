import { useQuery } from '@tanstack/react-query';
import { database } from '../lib/database';
import { TimelineData } from '../types/timeline';
import { Lineage } from '../types';
import { useUserId } from './useUserId';

export function useTimeline(lineageId: string, options?: { enabled?: boolean }) {
  const userId = useUserId();
  return useQuery<TimelineData>({
    queryKey: ['timeline', lineageId, userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return database.lineages.getTimelineData(lineageId, userId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: options?.enabled !== false && !!lineageId && !!userId,
  });
}

export function useTimelinesByProject(projectId: string, options?: { enabled?: boolean }) {
  const userId = useUserId();
  return useQuery<Lineage[]>({
    queryKey: ['timelines', projectId, userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return database.lineages.getByProject(projectId, userId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: options?.enabled !== false && !!projectId && !!userId,
  });
}

