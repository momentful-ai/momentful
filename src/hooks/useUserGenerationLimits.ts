import { useQuery } from '@tanstack/react-query';
import { getUserGenerationLimits, UserGenerationLimits } from '../services/generationLimits';
import { useUserId } from './useUserId';

export function useUserGenerationLimits() {
  const userId = useUserId();

  const { data, isLoading, error, refetch } = useQuery<UserGenerationLimits>({
    queryKey: ['user-generation-limits', userId],
    queryFn: () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return getUserGenerationLimits(userId);
    },
    enabled: !!userId,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
  });

  return {
    imagesRemaining: data?.imagesRemaining ?? 0,
    videosRemaining: data?.videosRemaining ?? 0,
    imagesLimit: data?.imagesLimit ?? 10,
    videosLimit: data?.videosLimit ?? 5,
    isLoading,
    error,
    refetch,
  };
}
