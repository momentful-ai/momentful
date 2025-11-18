import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MediaThumbnail } from '../../../components/shared/MediaThumbnail';
import { useSignedUrls } from '../../../hooks/useSignedUrls';

// Mock useSignedUrls hook
vi.mock('../../../hooks/useSignedUrls', () => ({
  useSignedUrls: vi.fn(),
}));

// Create a wrapper component for testing
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('MediaThumbnail', () => {
  let mockUseSignedUrl: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUseSignedUrl = vi.fn();

vi.mocked(useSignedUrls).mockReturnValue({
  useSignedUrl: mockUseSignedUrl,
  prefetchThumbnails: vi.fn(),
  clearCache: vi.fn(),
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

    vi.clearAllMocks();
  });

  it('should render img with src when src prop is provided', () => {
    const testSrc = 'https://example.com/image.jpg';
    const testAlt = 'Test image';

    render(
      <MediaThumbnail src={testSrc} alt={testAlt} />,
      { wrapper: createWrapper() }
    );

    const img = screen.getByAltText(testAlt);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', testSrc);
    expect(img).toHaveAttribute('draggable', 'false');
  });

  it('should render img with draggable when draggable prop is true', () => {
    const testSrc = 'https://example.com/image.jpg';
    const testAlt = 'Test image';

    render(
      <MediaThumbnail src={testSrc} alt={testAlt} draggable={true} />,
      { wrapper: createWrapper() }
    );

    const img = screen.getByAltText(testAlt);
    expect(img).toHaveAttribute('draggable', 'true');
  });

  it('should apply custom className', () => {
    const testSrc = 'https://example.com/image.jpg';
    const testAlt = 'Test image';
    const customClass = 'custom-thumbnail-class';

    render(
      <MediaThumbnail src={testSrc} alt={testAlt} className={customClass} />,
      { wrapper: createWrapper() }
    );

    const img = screen.getByAltText(testAlt);
    expect(img).toHaveClass(customClass);
  });

  it('should show loading spinner when fetching signed URL', async () => {
    const testPath = 'user-1/project-1/image.jpg';
    const testAlt = 'Test image';

    // Mock the useSignedUrl to return loading state
    mockUseSignedUrl.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(
      <MediaThumbnail storagePath={testPath} alt={testAlt} />,
      { wrapper: createWrapper() }
    );

    // Should show loading spinner
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should render img when signed URL is successfully loaded', async () => {
    const testPath = 'user-1/project-1/image.jpg';
    const testAlt = 'Test image';
    const signedUrl = 'https://supabase-url.com/signed-image.jpg';

    // Mock successful signed URL resolution
    mockUseSignedUrl.mockReturnValue({
      data: signedUrl,
      isLoading: false,
      error: null,
    });

    render(
      <MediaThumbnail storagePath={testPath} alt={testAlt} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      const img = screen.getByAltText(testAlt);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', signedUrl);
    });
  });

  it('should use custom bucket when provided', () => {
    const testPath = 'path/to/image.jpg';
    const testAlt = 'Test image';
    const customBucket = 'custom-bucket';

    mockUseSignedUrl.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(
      <MediaThumbnail storagePath={testPath} alt={testAlt} bucket={customBucket} />,
      { wrapper: createWrapper() }
    );

    expect(mockUseSignedUrl).toHaveBeenCalledWith(customBucket, testPath);
  });

  it('should use default bucket when not specified', () => {
    const testPath = 'path/to/image.jpg';
    const testAlt = 'Test image';

    mockUseSignedUrl.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(
      <MediaThumbnail storagePath={testPath} alt={testAlt} />,
      { wrapper: createWrapper() }
    );

    expect(mockUseSignedUrl).toHaveBeenCalledWith('user-uploads', testPath);
  });

  it('should show fallback UI when no src or storagePath', () => {
    const testAlt = 'Test image';

    render(
      <MediaThumbnail alt={testAlt} />,
      { wrapper: createWrapper() }
    );

    // Should show Film icon as fallback
    expect(document.querySelector('.lucide-film')).toBeInTheDocument();
  });

  it('should handle image load errors', async () => {
    const testSrc = 'https://example.com/broken-image.jpg';
    const testAlt = 'Test image';

    render(
      <MediaThumbnail src={testSrc} alt={testAlt} />,
      { wrapper: createWrapper() }
    );

    const img = screen.getByAltText(testAlt);

    // Simulate image load error
    img.dispatchEvent(new Event('error'));

    // Should still be in the document but with error state
    expect(img).toBeInTheDocument();
  });

  it('should handle signed URL image load errors', async () => {
    const testPath = 'user-1/project-1/image.jpg';
    const testAlt = 'Test image';
    const signedUrl = 'https://supabase-url.com/signed-image.jpg';

    mockUseSignedUrl.mockReturnValue({
      data: signedUrl,
      isLoading: false,
      error: null,
    });

    render(
      <MediaThumbnail storagePath={testPath} alt={testAlt} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      const img = screen.getByAltText(testAlt);
      expect(img).toBeInTheDocument();
    });

    // Simulate image load error
    const img = screen.getByAltText(testAlt);
    img.dispatchEvent(new Event('error'));

    // Image should still be present (error handling is internal)
    expect(img).toBeInTheDocument();
  });

  it('should call useSignedUrl with correct parameters', () => {
    const testPath = 'user-1/project-1/image.jpg';
    const testAlt = 'Test image';

    mockUseSignedUrl.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(
      <MediaThumbnail storagePath={testPath} alt={testAlt} />,
      { wrapper: createWrapper() }
    );

    expect(mockUseSignedUrl).toHaveBeenCalledTimes(1);
    expect(mockUseSignedUrl).toHaveBeenCalledWith('user-uploads', testPath);
  });
});
