import { useState, useCallback, useRef } from 'react';
import { database } from '../lib/database';

/**
 * Hook for managing signed URLs for secure storage access
 * Provides caching and async loading of signed URLs
 */
export function useSignedUrls() {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  // Track failed paths to prevent infinite retry loops
  const failedPaths = useRef<Set<string>>(new Set());

  /**
   * Get a signed URL for a storage path, using cache when available
   */
  const getSignedUrl = useCallback(async (bucket: string, path: string, expiresIn?: number): Promise<string> => {
    const cacheKey = `${bucket}:${path}`;

    // Return cached URL if available
    if (signedUrls[cacheKey]) {
      return signedUrls[cacheKey];
    }

    // Don't retry if this path has already failed (prevents infinite loops)
    if (failedPaths.current.has(cacheKey)) {
      throw new Error('Too many failed attempts. Please try again later.');
    }

    // Don't fetch if already loading
    if (loading[cacheKey]) {
      // Wait for existing request to complete (with timeout to prevent infinite loops)
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const maxWaitTime = 5000; // 5 seconds max wait (reduced from 30s)
        
        const checkCache = () => {
          if (signedUrls[cacheKey]) {
            resolve(signedUrls[cacheKey]);
          } else if (Date.now() - startTime > maxWaitTime) {
            failedPaths.current.add(cacheKey);
            reject(new Error('Timeout waiting for signed URL'));
          } else if (!loading[cacheKey]) {
            // Request completed but no URL - likely an error
            failedPaths.current.add(cacheKey);
            reject(new Error('Failed to get signed URL'));
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
      // Remove from failed paths on success
      failedPaths.current.delete(cacheKey);
      return signedUrl;
    } catch (error) {
      console.error('Failed to get signed URL:', { bucket, path }, error);
      // Mark as failed to prevent retries
      failedPaths.current.add(cacheKey);
      throw error; // Don't fallback to public URLs - surface the error
    } finally {
      setLoading(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, [signedUrls, loading]);

  /**
   * Preload signed URLs for multiple paths
   * Silently fails for individual paths to prevent blocking
   */
  const preloadSignedUrls = useCallback(async (
    bucket: string,
    paths: string[],
    expiresIn?: number
  ): Promise<Record<string, string>> => {
    const results: Record<string, string> = {};

    // Filter out paths that have already failed
    const pathsToLoad = paths.filter(path => {
      const cacheKey = `${bucket}:${path}`;
      return !failedPaths.current.has(cacheKey);
    });

    if (pathsToLoad.length === 0) {
      return results; // All paths have failed, return empty
    }

    const promises = pathsToLoad.map(async (path) => {
      try {
        const url = await getSignedUrl(bucket, path, expiresIn);
        results[path] = url;
      } catch {
        // Silently fail - already logged in getSignedUrl
        // Don't add to failedPaths here - getSignedUrl handles it
      }
    });

    await Promise.all(promises);
    return results;
  }, [getSignedUrl]);

  /**
   * Clear the signed URL cache and failed paths
   */
  const clearCache = useCallback(() => {
    setSignedUrls({});
    setLoading({});
    failedPaths.current.clear();
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
