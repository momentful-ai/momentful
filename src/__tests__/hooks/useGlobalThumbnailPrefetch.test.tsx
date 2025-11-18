import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGlobalThumbnailPrefetch } from '../../hooks/useGlobalThumbnailPrefetch';
import { useSignedUrls } from '../../hooks/useSignedUrls';
import { useUserId } from '../../hooks/useUserId';

// Mock dependencies
vi.mock('../../hooks/useSignedUrls', () => ({
  useSignedUrls: vi.fn(),
}));

vi.mock('../../hooks/useUserId', () => ({
  useUserId: vi.fn(),
}));

// Create a wrapper component for testing hooks
function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider
      client={new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
          mutations: { retry: false },
        },
      })}
    >
      {children}
    </QueryClientProvider>
  );
}

describe('useGlobalThumbnailPrefetch', () => {
  let mockClearCache: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockClearCache = vi.fn();

    // Mock the hooks
    vi.mocked(useUserId).mockReturnValue('user-1');

    vi.mocked(useSignedUrls).mockReturnValue({
      prefetchThumbnails: vi.fn(),
      clearCache: mockClearCache,
      useSignedUrl: vi.fn(),
      getSignedUrl: vi.fn(),
      preloadSignedUrls: vi.fn(),
      useOptimisticSignedUrl: vi.fn(),
      useMediaUrlPrefetch: vi.fn(),
      useMediaGalleryUrls: vi.fn(),
      getMultipleSignedUrls: vi.fn(),
      getUrlCacheStats: vi.fn(),
      config: {
        defaultExpiry: 86400,
        maxExpiry: 86400,
        prefetchExpiry: 43200,
        cacheBuffer: 21600,
        staleBuffer: 7200,
      },
      queryClient: {} as QueryClient,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should listen for cache invalidation events and clear cache', () => {
    renderHook(() => useGlobalThumbnailPrefetch(), {
      wrapper: createWrapper(),
    });

    // Simulate cache invalidation event
    window.dispatchEvent(new CustomEvent('thumbnail-cache-invalidated'));

    expect(mockClearCache).toHaveBeenCalled();
  });

});
