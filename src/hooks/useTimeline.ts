import { useQuery } from '@tanstack/react-query';
import { database } from '../lib/database';
import { TimelineData } from '../types/timeline';
import { Lineage } from '../types';

export function useTimeline(lineageId: string, options?: { enabled?: boolean }) {
  return useQuery<TimelineData>({
    queryKey: ['timeline', lineageId],
    queryFn: () => database.lineages.getTimelineData(lineageId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: options?.enabled !== false && !!lineageId,
  });
}

export function useTimelinesByProject(projectId: string, options?: { enabled?: boolean }) {
  return useQuery<Lineage[]>({
    queryKey: ['timelines', projectId],
    queryFn: () => database.lineages.getByProject(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: options?.enabled !== false && !!projectId,
  });
}

