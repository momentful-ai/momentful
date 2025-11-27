import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSignedUrls } from '../../hooks/useSignedUrls';

// Mock Clerk to avoid context issues
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({
    user: { id: 'test-user-id' },
    isLoaded: true,
    isSignedIn: true,
  }),
}));

// Mock useUserId to return a consistent user ID
vi.mock('../../hooks/useUserId', () => ({
  useUserId: () => 'test-user-id',
}));

// Create a test wrapper with QueryClient
function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries by default for testing
        gcTime: 0, // Disable cache for testing
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useSignedUrls hook', () => {
  let wrapper: React.ComponentType<{ children: React.ReactNode }>;

  beforeEach(() => {
    wrapper = createTestWrapper();
    vi.clearAllMocks();
  });

  describe('useSignedUrl', () => {
    it('should return a query object with correct configuration', () => {
      const { result } = renderHook(
        () => useSignedUrls().useSignedUrl('user-uploads', 'user123/file.jpg'),
        { wrapper }
      );

      // Should return a React Query result object
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
    });

    it('should have correct query key structure', () => {
      // Test that the hook creates the expected query key structure
      // We can't easily test the internal query key, but we can test the hook returns the expected interface
      const { result } = renderHook(
        () => useSignedUrls().useSignedUrl('user-uploads', 'user123/file.jpg'),
        { wrapper }
      );

      expect(result.current).toBeDefined();
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should handle custom expiresIn parameter', () => {
      const { result: result1 } = renderHook(
        () => useSignedUrls().useSignedUrl('user-uploads', 'user123/file.jpg'),
        { wrapper }
      );

      const { result: result2 } = renderHook(
        () => useSignedUrls().useSignedUrl('user-uploads', 'user123/file.jpg', 7200),
        { wrapper }
      );

      // Both should return query objects
      expect(result1.current).toHaveProperty('data');
      expect(result2.current).toHaveProperty('data');
    });
  });

  describe('getSignedUrl method', () => {
    it('should be a function', () => {
      const { result } = renderHook(() => useSignedUrls(), { wrapper });

      expect(typeof result.current.getSignedUrl).toBe('function');
    });
  });

  describe('clearCache method', () => {
    it('should be a function', () => {
      const { result } = renderHook(() => useSignedUrls(), { wrapper });

      expect(typeof result.current.clearCache).toBe('function');
    });
  });

  describe('configuration', () => {
    it('should expose MEDIA_URL_CONFIG', () => {
      const { result } = renderHook(() => useSignedUrls(), { wrapper });

      expect(result.current.config).toHaveProperty('defaultExpiry');
      expect(result.current.config).toHaveProperty('maxExpiry');
      expect(result.current.config).toHaveProperty('prefetchExpiry');
      expect(result.current.config).toHaveProperty('cacheBuffer');
      expect(result.current.config).toHaveProperty('staleBuffer');
    });
  });
});
