import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { VideoThumbnail } from '../../../components/shared/VideoThumbnail';
import { useSignedUrls } from '../../../hooks/useSignedUrls';
import { createTestQueryClient, createTestRenderer } from '../../test-utils.tsx';

// Mock useSignedUrls hook
vi.mock('../../../hooks/useSignedUrls', () => ({
  useSignedUrls: vi.fn(() => ({
    useSignedUrl: vi.fn(() => ({
      data: undefined as string | undefined,
      isLoading: false,
      isError: false,
      error: null,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      status: 'success' as const,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetching: false,
      isStale: false,
      isPlaceholderData: false,
      isInitialLoading: false,
      isPaused: false,
      fetchStatus: 'idle' as const,
      isEnabled: true,
      refetch: vi.fn(),
      promise: undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)),
  })),
}));

const mockUseSignedUrls = vi.mocked(useSignedUrls);

describe('VideoThumbnail', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let renderWithQueryClient: ReturnType<typeof createTestRenderer>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    renderWithQueryClient = createTestRenderer(queryClient);
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with direct src URL', () => {
      const testSrc = 'https://example.com/video-thumbnail.jpg';
      const testAlt = 'Test video thumbnail';

      renderWithQueryClient(
        <VideoThumbnail
          src={testSrc}
          alt={testAlt}
          width={320}
          height={180}
        />
      );

      const img = screen.getByAltText(testAlt);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', testSrc);
    });

    it('can be imported and used', () => {
      // Simple smoke test to ensure component can be rendered
      expect(VideoThumbnail).toBeDefined();
    });

    it('renders with storagePath and resolves signed URL', async () => {
      const testStoragePath = 'user-uploads/test-video.mp4';
      const signedUrl = 'https://signed.example.com/user-uploads/test-video.mp4';
      const testAlt = 'Test video';

      mockUseSignedUrls.mockReturnValue({
        useSignedUrl: vi.fn(() => ({
          data: signedUrl,
          isLoading: false,
          isError: false,
          error: null,
          isPending: false,
          isLoadingError: false,
          isRefetchError: false,
          isSuccess: true,
          status: 'success',
          dataUpdatedAt: Date.now(),
          errorUpdatedAt: 0,
          failureCount: 0,
          failureReason: null,
          errorUpdateCount: 0,
          isFetched: true,
          isFetchedAfterMount: true,
          isFetching: false,
          isRefetching: false,
          isStale: false,
          isPlaceholderData: false,
          isInitialLoading: false,
          isPaused: false,
          fetchStatus: 'idle',
          isEnabled: true,
          refetch: vi.fn(),
          promise: undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)),
        getSignedUrl: vi.fn(),
        preloadSignedUrls: vi.fn(),
        prefetchThumbnails: vi.fn(),
        clearCache: vi.fn(),
        useOptimisticSignedUrl: vi.fn(),
        useMediaUrlPrefetch: vi.fn(),
        useMediaGalleryUrls: vi.fn(),
        getMultipleSignedUrls: vi.fn(),
        getUrlCacheStats: vi.fn(),
        config: { defaultExpiry: 86400, maxExpiry: 86400, prefetchExpiry: 43200, cacheBuffer: 21600, staleBuffer: 7200 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queryClient: {} as any,
      });

      renderWithQueryClient(
        <VideoThumbnail
          storagePath={testStoragePath}
          alt={testAlt}
          width={240}
          height={135}
        />
      );

      await waitFor(() => {
        const img = screen.getByAltText(testAlt);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', signedUrl);
      });
    });

    it('shows loading state when signed URL is loading', () => {
      const testStoragePath = 'user-uploads/test-video.mp4';

      mockUseSignedUrls.mockReturnValue({
        useSignedUrl: vi.fn(() => ({
          data: undefined,
          isLoading: true,
          isError: false,
          error: null,
          isPending: true,
          isLoadingError: false,
          isRefetchError: false,
          isSuccess: false,
          status: 'pending',
          dataUpdatedAt: 0,
          errorUpdatedAt: 0,
          failureCount: 0,
          failureReason: null,
          errorUpdateCount: 0,
          isFetched: false,
          isFetchedAfterMount: false,
          isFetching: true,
          isRefetching: false,
          isStale: false,
          isPlaceholderData: false,
          isInitialLoading: true,
          isPaused: false,
          fetchStatus: 'fetching',
          isEnabled: true,
          refetch: vi.fn(),
          promise: undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)),
        getSignedUrl: vi.fn(),
        preloadSignedUrls: vi.fn(),
        prefetchThumbnails: vi.fn(),
        clearCache: vi.fn(),
        useOptimisticSignedUrl: vi.fn(),
        useMediaUrlPrefetch: vi.fn(),
        useMediaGalleryUrls: vi.fn(),
        getMultipleSignedUrls: vi.fn(),
        getUrlCacheStats: vi.fn(),
        config: { defaultExpiry: 86400, maxExpiry: 86400, prefetchExpiry: 43200, cacheBuffer: 21600, staleBuffer: 7200 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queryClient: {} as any,
      });

      renderWithQueryClient(
        <VideoThumbnail
          storagePath={testStoragePath}
          alt="Loading video"
          width={240}
          height={135}
        />
      );

      // Should show loading spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('falls back to placeholder when no src or storagePath provided', () => {
      renderWithQueryClient(
        <VideoThumbnail
          alt="No source video"
          width={240}
          height={135}
        />
      );

      const img = screen.getByAltText('No source video');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/placeholder.svg');
    });
  });

  describe('Selected State', () => {
    it('applies selected colors when selected prop is true', () => {
      renderWithQueryClient(
        <VideoThumbnail
          src="https://example.com/selected-video.jpg"
          alt="Selected video"
          width={240}
          height={135}
          selected={true}
        />
      );

      // Check for selected colors in the film strips
      const container = document.querySelector('[class*="inline-flex"]');
      expect(container).toBeInTheDocument();

      // The film strips should have the selected color applied
      // We can check for the style attribute containing the selected color (converted to RGB by browser)
      const leftStrip = container?.querySelector('div[class*="w-5"][class*="flex"][class*="flex-col"]');
      expect(leftStrip).toHaveAttribute('style');
      expect(leftStrip?.getAttribute('style')).toContain('rgb(109, 93, 231)'); // SELECTED_COLORS.primary converted to RGB

      // Check for selection ring
      const mainArea = container?.querySelector('div[class*="flex-1"][class*="overflow-hidden"]');
      expect(mainArea).toHaveAttribute('style');
      expect(mainArea?.getAttribute('style')).toContain('box-shadow');

      // Check for checkmark badge
      const checkmark = document.querySelector('svg[class*="text-white"]');
      expect(checkmark).toBeInTheDocument();
    });

    it('applies unselected colors when selected prop is false', () => {
      renderWithQueryClient(
        <VideoThumbnail
          src="https://example.com/unselected-video.jpg"
          alt="Unselected video"
          width={240}
          height={135}
          selected={false}
        />
      );

      const container = document.querySelector('[class*="inline-flex"]');
      expect(container).toBeInTheDocument();

      // Check for unselected colors in the film strips
      const leftStrip = container?.querySelector('div[class*="w-5"][class*="flex"][class*="flex-col"]');
      expect(leftStrip).toHaveAttribute('style');
      expect(leftStrip?.getAttribute('style')).toContain('rgb(24, 24, 27)'); // unselected color converted to RGB
    });

    it('defaults to unselected when selected prop is not provided', () => {
      renderWithQueryClient(
        <VideoThumbnail
          src="https://example.com/default-video.jpg"
          alt="Default video"
          width={240}
          height={135}
        />
      );

      const container = document.querySelector('[class*="inline-flex"]');
      expect(container).toBeInTheDocument();

      // Should use unselected colors by default
      const leftStrip = container?.querySelector('div[class*="w-5"][class*="flex"][class*="flex-col"]');
      expect(leftStrip?.getAttribute('style')).toContain('rgb(24, 24, 27)');
    });
  });

  describe('Film Strip Generation', () => {
    it('generates correct number of film strip holes based on height', () => {
      renderWithQueryClient(
        <VideoThumbnail
          src="https://example.com/test-video.jpg"
          alt="Film strip test"
          width={240}
          height={180}
        />
      );

      const container = document.querySelector('[class*="inline-flex"]');
      expect(container).toBeInTheDocument();

      // For height 180, Math.max(3, Math.floor(180 / 32)) = Math.max(3, 5) = 5
      // So we should have 5 holes on each side
      const leftStrip = container?.querySelector('div[class*="w-5"]:first-child');
      const rightStrip = container?.querySelector('div[class*="w-5"]:last-child');
      const leftHoles = leftStrip?.querySelectorAll('div[class*="w-2.5"]');
      const rightHoles = rightStrip?.querySelectorAll('div[class*="w-2.5"]');

      expect(leftHoles).toHaveLength(5);
      expect(rightHoles).toHaveLength(5);
    });

    it('generates minimum 3 holes even for small heights', () => {
      renderWithQueryClient(
        <VideoThumbnail
          src="https://example.com/small-video.jpg"
          alt="Small film strip test"
          width={120}
          height={50}
        />
      );

      const container = document.querySelector('[class*="inline-flex"]');
      expect(container).toBeInTheDocument();

      // For height 50, Math.max(3, Math.floor(50 / 32)) = Math.max(3, 1) = 3
      const leftStrip = container?.querySelector('div[class*="w-5"]:first-child');
      const leftHoles = leftStrip?.querySelectorAll('div[class*="w-2.5"]');

      expect(leftHoles).toHaveLength(3);
    });
  });

  describe('Dimensions', () => {
    it('applies correct width and height styles', () => {
      const testWidth = 320;
      const testHeight = 180;

      renderWithQueryClient(
        <VideoThumbnail
          src="https://example.com/dimension-test.jpg"
          alt="Dimension test"
          width={testWidth}
          height={testHeight}
        />
      );

      const container = document.querySelector('[class*="inline-flex"]');
      expect(container).toBeInTheDocument();

      const computedStyle = window.getComputedStyle(container as Element);
      expect(computedStyle.width).toBe(`${testWidth}px`);
      expect(computedStyle.height).toBe(`${testHeight}px`);
    });

    it('uses default dimensions when not provided', () => {
      renderWithQueryClient(
        <VideoThumbnail
          src="https://example.com/default-dimension.jpg"
          alt="Default dimension test"
        />
      );

      const container = document.querySelector('[class*="inline-flex"]');
      expect(container).toBeInTheDocument();

      // Check the inline style directly
      const inlineStyle = (container as HTMLElement).style;
      expect(inlineStyle.width).toBe('320px');
      expect(inlineStyle.height).toBe('180px');
    });
  });

  describe('Video Play Icon', () => {
    it('renders play icon overlay', () => {
      renderWithQueryClient(
        <VideoThumbnail
          src="https://example.com/play-icon-test.jpg"
          alt="Play icon test"
          width={240}
          height={135}
        />
      );

      // Look for the Play icon (Lucide React Play component)
      const playIcon = document.querySelector('svg');
      expect(playIcon).toBeInTheDocument();

      // Check that it has the play-specific classes
      const container = document.querySelector('[class*="w-10"][class*="h-10"]');
      expect(container).toBeInTheDocument();
    });

    it('applies hover effects to play icon', () => {
      renderWithQueryClient(
        <VideoThumbnail
          src="https://example.com/hover-test.jpg"
          alt="Hover test"
          width={240}
          height={135}
        />
      );

      const container = document.querySelector('[class*="inline-flex"]');
      expect(container).toBeInTheDocument();

      // Check that the container has group class for hover effects
      expect(container?.className).toContain('group');
    });
  });

  describe('Film Grain Texture', () => {
    it('includes film grain texture overlay', () => {
      renderWithQueryClient(
        <VideoThumbnail
          src="https://example.com/grain-test.jpg"
          alt="Grain test"
          width={240}
          height={135}
        />
      );

      // Look for the film grain div with the specific background image
      const grainTexture = document.querySelector('[style*="data:image/svg+xml"]');
      expect(grainTexture).toBeInTheDocument();

      // Check that it has the correct opacity
      expect(grainTexture?.className).toContain('opacity-10');
    });
  });

  describe('Error Handling', () => {
    it('handles image load errors gracefully', () => {
      renderWithQueryClient(
        <VideoThumbnail
          src="https://invalid-url-that-will-error.jpg"
          alt="Error test"
          width={240}
          height={135}
        />
      );

      const img = screen.getByAltText('Error test');
      expect(img).toBeInTheDocument();

      // Simulate error
      fireEvent.error(img);

      // Component should still be rendered (error handling is internal)
      expect(img).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper alt text for screen readers', () => {
      const altText = 'Accessible video thumbnail';

      renderWithQueryClient(
        <VideoThumbnail
          src="https://example.com/accessibility.jpg"
          alt={altText}
          width={240}
          height={135}
        />
      );

      const img = screen.getByAltText(altText);
      expect(img).toBeInTheDocument();
    });

    it('defaults to empty alt text when not provided', () => {
      renderWithQueryClient(
        <VideoThumbnail
          src="https://example.com/no-alt.jpg"
          width={240}
          height={135}
        />
      );

      const img = screen.getByAltText('Video thumbnail'); // default alt
      expect(img).toBeInTheDocument();
    });
  });
});