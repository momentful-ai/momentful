import { useQuery } from '@tanstack/react-query';
import { database } from '../lib/database';
import { Project } from '../types';
import { useUserId } from './useUserId';

export function useProjects(options?: { enabled?: boolean }) {
  const userId = useUserId();
  return useQuery<Project[]>({
    queryKey: ['projects', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return database.projects.list(userId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: options?.enabled !== false && !!userId,
  });
}




