import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { database } from '../lib/database';
import { clearSignedUrlCache } from '../lib/storage-utils';

/**
 * Hook for managing signed URLs for immutable media using React Query
 * Optimized for media files that never change once uploaded
 */
export function useSignedUrls() {
  const queryClient = useQueryClient();

  // Supabase-compliant expiry limits for immutable media
  // Server-side validation: AI models endpoint allows max 24 hours
  const MEDIA_URL_CONFIG = {
    defaultExpiry: 24 * 60 * 60, // 24 hours (matches server limit for AI models)
    maxExpiry: 24 * 60 * 60, // 24 hours max (server-enforced limit)
    prefetchExpiry: 12 * 60 * 60, // 12 hours for prefetched URLs (half of max)
    cacheBuffer: 6 * 60 * 60, // 6 hours buffer before expiry (25% of max)
    staleBuffer: 2 * 60 * 60, // 2 hours stale buffer (8% of max)
  };

  /**
   * Query function for fetching signed URLs with optimized expiry
   */
  const fetchSignedUrl = useCallback(async ({
    bucket,
    path,
    expiresIn,
    isPrefetch = false
  }: {
    bucket: string;
    path: string;
    expiresIn?: number;
    isPrefetch?: boolean;
  }) => {
    // Use optimized expiry for media (within server limits)
    const actualExpiresIn = Math.min(
      expiresIn || (isPrefetch ? MEDIA_URL_CONFIG.prefetchExpiry : MEDIA_URL_CONFIG.defaultExpiry),
      MEDIA_URL_CONFIG.maxExpiry
    );
    return await database.storage.getSignedUrl(bucket, path, actualExpiresIn);
  }, [MEDIA_URL_CONFIG.defaultExpiry, MEDIA_URL_CONFIG.maxExpiry, MEDIA_URL_CONFIG.prefetchExpiry]);

  /**
   * Get a signed URL for immutable media with optimized caching
   * Since media is immutable, we can cache URLs much more aggressively
   */
  const useSignedUrl = (bucket: string, path: string, expiresIn?: number) => {
    const expiresInSeconds = Math.min(expiresIn || MEDIA_URL_CONFIG.defaultExpiry, MEDIA_URL_CONFIG.maxExpiry);

    return useQuery({
      queryKey: ['signed-url', bucket, path],
      queryFn: () => fetchSignedUrl({ bucket, path, expiresIn: expiresInSeconds }),
      // Supabase-compliant caching - ensure positive values and respect server limits
      gcTime: Math.max(0, Math.min((expiresInSeconds - MEDIA_URL_CONFIG.cacheBuffer) * 1000, 23 * 60 * 60 * 1000)), // Max 23 hours cache
      staleTime: Math.max(0, Math.min((expiresInSeconds - MEDIA_URL_CONFIG.staleBuffer) * 1000, 22 * 60 * 60 * 1000)), // Max 22 hours stale
      refetchOnMount: false, // Don't refetch if we have a cached URL
      refetchOnWindowFocus: false, // Media URLs don't need focus refetching
      refetchOnReconnect: false, // Media URLs don't need reconnect refetching
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error instanceof Error && (error.message.includes('403') || error.message.includes('401'))) {
          return false;
        }
        return failureCount < 1; // Only retry once for media URLs
      },
      retryDelay: 1000, // Quick retry
      // Enable background refetching for seamless experience
      refetchInterval: (query) => {
        // Background refresh when URL becomes stale
        const isStale = query.state.dataUpdatedAt + (MEDIA_URL_CONFIG.staleBuffer * 1000) < Date.now();
        return isStale ? 5 * 60 * 1000 : false; // Refresh every 5 minutes when stale
      },
    });
  };

  /**
   * Optimized mutation for preloading multiple signed URLs
   * Uses longer expiry for prefetched URLs since they're for immutable media
   */
  const {
    mutate: preloadSignedUrls,
    mutateAsync: preloadSignedUrlsAsync,
  } = useMutation({
    mutationFn: async ({
      bucket,
      paths,
      expiresIn
    }: {
      bucket: string;
      paths: string[];
      expiresIn?: number;
    }) => {
      const results: Record<string, string> = {};

      // Use prefetch expiry for batch operations (within server limits)
      const actualExpiresIn = Math.min(expiresIn || MEDIA_URL_CONFIG.prefetchExpiry, MEDIA_URL_CONFIG.maxExpiry);

      const promises = paths.map(async (path) => {
        try {
          // Check if we already have a cached URL
          const existingData = queryClient.getQueryData(['signed-url', bucket, path]);
          if (existingData) {
            results[path] = existingData as string;
            return;
          }

          const url = await fetchSignedUrl({ bucket, path, expiresIn: actualExpiresIn, isPrefetch: true });
          results[path] = url;

          // Cache with longer expiry for prefetched URLs
          queryClient.setQueryData(['signed-url', bucket, path], url, {
            updatedAt: Date.now(),
          });
        } catch (error) {
          console.error(`Failed to preload signed URL for ${bucket}/${path}:`, error);
          // Continue with other URLs even if one fails
        }
      });

      await Promise.all(promises);
      return results;
    },
  });

  /**
   * Clear all signed URL caches
   */
  const clearCache = () => {
    // Clear React Query cache for signed URLs
    queryClient.invalidateQueries({ queryKey: ['signed-url'] });
    // Clear the global storage utils cache
    clearSignedUrlCache();
  };

  /**
   * Optimized batch fetching for multiple media URLs
   * Takes advantage of media immutability for better performance
   */
  const getMultipleSignedUrls = async (
    items: Array<{ bucket: string; path: string; expiresIn?: number }>,
    options?: { skipCache?: boolean; priority?: 'high' | 'normal' | 'low' }
  ) => {
    const results: Record<string, string> = {};

    if (options?.skipCache) {
      // Force fresh fetch for all items with optimized batch processing
      const promises = items.map(async (item) => {
        try {
          const url = await fetchSignedUrl({
            bucket: item.bucket,
            path: item.path,
            expiresIn: item.expiresIn,
            isPrefetch: options.priority === 'low'
          });
          results[`${item.bucket}:${item.path}`] = url;
          // Update cache with optimized settings
          queryClient.setQueryData(['signed-url', item.bucket, item.path], url);
        } catch (error) {
          console.error(`Failed to get signed URL for ${item.bucket}/${item.path}:`, error);
        }
      });
      await Promise.all(promises);
    } else {
      // Smart batch prefetching - check cache first, then batch remaining requests
      const uncachedItems = items.filter(item => {
        const existingData = queryClient.getQueryData(['signed-url', item.bucket, item.path]);
        if (existingData) {
          results[`${item.bucket}:${item.path}`] = existingData as string;
          return false;
        }
        return true;
      });

      if (uncachedItems.length > 0) {
        // Batch prefetch uncached items
        const prefetchPromises = uncachedItems.map(item =>
          queryClient.prefetchQuery({
            queryKey: ['signed-url', item.bucket, item.path],
            queryFn: () => fetchSignedUrl({
              bucket: item.bucket,
              path: item.path,
              expiresIn: item.expiresIn,
              isPrefetch: true
            }),
            staleTime: MEDIA_URL_CONFIG.staleBuffer * 1000,
          })
        );

        await Promise.all(prefetchPromises);

        // Collect results from cache
        uncachedItems.forEach(item => {
          const data = queryClient.getQueryData(['signed-url', item.bucket, item.path]);
          if (data) {
            results[`${item.bucket}:${item.path}`] = data as string;
          }
        });
      }
    }

    return results;
  };

  /**
   * Hook for predictive prefetching of media URLs
   * Automatically prefetches URLs that are likely to be viewed soon
   */
  const useMediaUrlPrefetch = () => {
    const prefetchUrls = async (items: Array<{ bucket: string; path: string }>) => {
      const uncachedItems = items.filter(item =>
        !queryClient.getQueryData(['signed-url', item.bucket, item.path])
      );

      if (uncachedItems.length > 0) {
        await preloadSignedUrlsAsync({
          bucket: uncachedItems[0].bucket, // Assume same bucket for simplicity
          paths: uncachedItems.map(item => item.path),
          expiresIn: Math.min(MEDIA_URL_CONFIG.prefetchExpiry, MEDIA_URL_CONFIG.maxExpiry)
        });
      }
    };

    return { prefetchUrls };
  };

  /**
   * Hook for optimistic signed URL handling
   * Returns cached URL immediately while refreshing in background
   */
  const useOptimisticSignedUrl = (bucket: string, path: string, expiresIn?: number) => {
    const query = useSignedUrl(bucket, path, expiresIn);

    // For immutable media, if we have a cached URL, use it optimistically
    // even if it's stale - the URL will still work until it actually expires
    const optimisticData = query.data || queryClient.getQueryData(['signed-url', bucket, path]);

    return {
      ...query,
      data: optimisticData, // Always return cached data if available
      isOptimistic: !query.data && !!optimisticData, // Flag when using stale data
    };
  };

  /**
   * Hook for managing signed URLs in media galleries
   * Automatically prefetches URLs for visible and nearby items
   */
  const useMediaGalleryUrls = (
    mediaItems: Array<{ bucket: string; path: string; id: string }>,
    options?: {
      prefetchCount?: number; // How many items to prefetch ahead
      enableOptimistic?: boolean; // Use optimistic URLs
    }
  ) => {
    const { prefetchCount = 3, enableOptimistic = true } = options || {};
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: prefetchCount });

    // Prefetch URLs for items that are likely to be viewed soon
    useEffect(() => {
      const prefetchItems = mediaItems.slice(visibleRange.start, visibleRange.end + prefetchCount);
      if (prefetchItems.length > 0) {
        // Prefetch in background (within server limits)
        preloadSignedUrls({
          bucket: prefetchItems[0].bucket,
          paths: prefetchItems.map(item => item.path),
          expiresIn: Math.min(MEDIA_URL_CONFIG.prefetchExpiry, MEDIA_URL_CONFIG.maxExpiry)
        });
      }
    }, [visibleRange, mediaItems, prefetchCount]);

    const updateVisibleRange = (start: number, end: number) => {
      setVisibleRange({ start, end });
    };

    return {
      updateVisibleRange,
      mediaItems,
      prefetchCount,
      enableOptimistic,
    };
  };

  /**
   * Performance monitoring for signed URL usage
   */
  const getUrlCacheStats = () => {
    const queries = queryClient.getQueryCache().findAll({ queryKey: ['signed-url'] });
    return {
      totalCached: queries.length,
      staleCount: queries.filter(q => q.isStale()).length,
      errorCount: queries.filter(q => q.state.status === 'error').length,
      cacheSize: queries.reduce((size, q) => size + (q.state.data ? 1 : 0), 0),
    };
  };

  // Provide a simple async function for backward compatibility
  const getSignedUrl = useCallback(async (bucket: string, path: string, expiresIn?: number): Promise<string> => {
    const queryKey = ['signed-url', bucket, path];
    const expiresInSeconds = Math.min(expiresIn || MEDIA_URL_CONFIG.defaultExpiry, MEDIA_URL_CONFIG.maxExpiry);

    // Check if we already have cached data
    const cachedData = queryClient.getQueryData(queryKey);
    if (cachedData) {
      return cachedData as string;
    }

    // Fetch the signed URL using queryClient directly (no hooks)
    try {
      const signedUrl = await queryClient.fetchQuery({
        queryKey,
        queryFn: () => fetchSignedUrl({ bucket, path, expiresIn: expiresInSeconds }),
        staleTime: Math.min((expiresInSeconds - MEDIA_URL_CONFIG.staleBuffer) * 1000, 22 * 60 * 60 * 1000),
        gcTime: Math.min((expiresInSeconds - MEDIA_URL_CONFIG.cacheBuffer) * 1000, 23 * 60 * 60 * 1000),
      });

      return signedUrl;
    } catch (error) {
      console.error('Failed to get signed URL:', error);
      throw error;
    }
  }, [queryClient, MEDIA_URL_CONFIG.cacheBuffer, MEDIA_URL_CONFIG.defaultExpiry, MEDIA_URL_CONFIG.maxExpiry, MEDIA_URL_CONFIG.staleBuffer, fetchSignedUrl]);

  /**
   * Prefetch thumbnails for a list of media items
   * Useful for preloading thumbnails that are likely to be viewed soon
   */
  const prefetchThumbnails = useCallback(async (
    items: Array<{ src?: string; storagePath?: string; bucket?: string }>
  ) => {
    const storagePaths = items
      .filter(item => !item.src && item.storagePath)
      .map(item => ({
        bucket: item.bucket || 'user-uploads',
        path: item.storagePath!
      }));

    if (storagePaths.length > 0) {
      // Group by bucket for efficient prefetching
      const byBucket = storagePaths.reduce((acc, item) => {
        if (!acc[item.bucket]) acc[item.bucket] = [];
        acc[item.bucket].push(item.path);
        return acc;
      }, {} as Record<string, string[]>);

      // Prefetch each bucket
      const prefetchPromises = Object.entries(byBucket).map(([bucket, paths]) =>
        preloadSignedUrlsAsync({
          bucket,
          paths,
          expiresIn: MEDIA_URL_CONFIG.prefetchExpiry
        })
      );

      await Promise.all(prefetchPromises);
    }
  }, [preloadSignedUrlsAsync, MEDIA_URL_CONFIG.prefetchExpiry]);

  return {
    // React Query hooks (recommended)
    useSignedUrl,
    useOptimisticSignedUrl,
    useMediaUrlPrefetch,
    useMediaGalleryUrls,

    // Utility functions (for backward compatibility)
    getSignedUrl, // Simple async function
    preloadSignedUrls: preloadSignedUrlsAsync,
    prefetchThumbnails, // New: prefetch thumbnails for media items
    clearCache,
    getMultipleSignedUrls,
    getUrlCacheStats,

    // Configuration for advanced usage
    config: MEDIA_URL_CONFIG,
    // Expose React Query utilities for advanced usage
    queryClient,
  };
}
