import { useState, useCallback } from 'react';
import { database } from '../lib/database';

/**
 * Hook for managing signed URLs for secure storage access
 * Provides caching and async loading of signed URLs
 */
export function useSignedUrls() {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  /**
   * Get a signed URL for a storage path, using cache when available
   */
  const getSignedUrl = useCallback(async (bucket: string, path: string, expiresIn?: number): Promise<string> => {
    const cacheKey = `${bucket}:${path}`;

    // Return cached URL if available
    if (signedUrls[cacheKey]) {
      return signedUrls[cacheKey];
    }

    // Don't fetch if already loading
    if (loading[cacheKey]) {
      // Wait for existing request to complete
      return new Promise((resolve) => {
        const checkCache = () => {
          if (signedUrls[cacheKey]) {
            resolve(signedUrls[cacheKey]);
          } else {
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }

    // Start loading
    setLoading(prev => ({ ...prev, [cacheKey]: true }));

    try {
      const signedUrl = await database.storage.getSignedUrl(bucket, path, expiresIn);
      setSignedUrls(prev => ({ ...prev, [cacheKey]: signedUrl }));
      return signedUrl;
    } catch (error) {
      console.error('Failed to get signed URL:', { bucket, path }, error);
      // Fallback to public URL for backward compatibility
      return database.storage.getPublicUrl(bucket, path);
    } finally {
      setLoading(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, [signedUrls, loading]);

  /**
   * Preload signed URLs for multiple paths
   */
  const preloadSignedUrls = useCallback(async (
    bucket: string,
    paths: string[],
    expiresIn?: number
  ): Promise<Record<string, string>> => {
    const results: Record<string, string> = {};

    const promises = paths.map(async (path) => {
      try {
        const url = await getSignedUrl(bucket, path, expiresIn);
        results[path] = url;
      } catch (error) {
        console.error('Failed to preload signed URL for:', path, error);
      }
    });

    await Promise.all(promises);
    return results;
  }, [getSignedUrl]);

  /**
   * Clear the signed URL cache
   */
  const clearCache = useCallback(() => {
    setSignedUrls({});
    setLoading({});
  }, []);

  /**
   * Check if a signed URL is currently being loaded
   */
  const isLoading = useCallback((bucket: string, path: string) => {
    return loading[`${bucket}:${path}`] || false;
  }, [loading]);

  return {
    getSignedUrl,
    preloadSignedUrls,
    clearCache,
    isLoading,
  };
}
