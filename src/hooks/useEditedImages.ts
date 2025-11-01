import { useQuery } from '@tanstack/react-query';
import { database } from '../lib/database';
import { EditedImage } from '../types';

export function useEditedImages(projectId: string, options?: { enabled?: boolean }) {
  return useQuery<EditedImage[]>({
    queryKey: ['edited-images', projectId],
    queryFn: () => database.editedImages.list(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: options?.enabled !== false,
  });
}

