import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSignedUrls } from './useSignedUrls';
import { useProjects } from './useProjects';

/**
 * Global thumbnail prefetching hook for dashboard-level caching
 * Prefetches project preview thumbnails when user lands on dashboard and listens for cache invalidation events
 * Other thumbnails (media assets, edited images, generated videos) are prefetched when navigating to specific projects
 */
export function useGlobalThumbnailPrefetch() {
  const { clearCache, prefetchThumbnails } = useSignedUrls();
  const queryClient = useQueryClient();

  // Get projects data to prefetch preview thumbnails
  const { data: projects = [] } = useProjects();

  // Prefetch project preview thumbnails on mount when data is available
  useEffect(() => {
    if (projects.length === 0) {
      return; // No projects to prefetch yet
    }

    const itemsToPrefetch: Array<{ storagePath?: string }> = [];

    // Collect project preview images
    projects.forEach(project => {
      if (project.previewImages) {
        project.previewImages.forEach(path => {
          itemsToPrefetch.push({ storagePath: path });
        });
      }
    });

    if (itemsToPrefetch.length > 0) {
      console.log(`Prefetching ${itemsToPrefetch.length} project preview thumbnails globally`);
      prefetchThumbnails(itemsToPrefetch).catch(error => {
        console.warn('Failed to prefetch project preview thumbnails globally:', error);
      });
    }
  }, [projects, prefetchThumbnails]);

  // Listen for cache invalidation events
  useEffect(() => {
    const handleCacheInvalidation = () => {
      console.log('Thumbnail cache invalidated');
      // Clear signed URL cache
      clearCache();
      // Invalidate React Query cache for signed URLs
      queryClient.invalidateQueries({ queryKey: ['signed-url'] });

      // Re-prefetch project preview thumbnails after a short delay to allow for database updates
      setTimeout(() => {
        const currentProjects = (queryClient.getQueryData(['projects']) as Array<{ previewImages?: string[] }>) || [];

        const itemsToPrefetch = [
          // Project preview images
          ...currentProjects.flatMap(project =>
            (project.previewImages || []).map(path => ({ storagePath: path }))
          ),
        ];

        if (itemsToPrefetch.length > 0) {
          prefetchThumbnails(itemsToPrefetch).catch(error => {
            console.warn('Failed to re-prefetch project preview thumbnails after invalidation:', error);
          });
        }
      }, 1000); // 1 second delay
    };

    window.addEventListener('thumbnail-cache-invalidated', handleCacheInvalidation);

    return () => {
      window.removeEventListener('thumbnail-cache-invalidated', handleCacheInvalidation);
    };
  }, [clearCache, queryClient, prefetchThumbnails]);

  return {};
}
