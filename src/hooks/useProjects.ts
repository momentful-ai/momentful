import { useQuery } from '@tanstack/react-query';
import { database } from '../lib/database';
import { Project } from '../types';

export function useProjects(options?: { enabled?: boolean }) {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => database.projects.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: options?.enabled !== false,
  });
}



