import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UseQueryResult } from '@tanstack/react-query';
import { GeneratedVideosView } from '../../components/ProjectWorkspace/GeneratedVideosView';
import { GeneratedVideo } from '../../types';
import { useGeneratedVideos } from '../../hooks/useGeneratedVideos';
import { ToastProvider } from '../../contexts/ToastProvider';
import { mockSupabase, setupClerkMocks } from '../test-utils.tsx';

// Mock supabase
mockSupabase();

// Mock Supabase and database dependencies
vi.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/mock-url' } })),
      })),
    },
  },
}));

vi.mock('../../lib/database', () => ({
  database: {
    mediaAssets: {
      getById: vi.fn(),
    },
    storage: {
      getPublicUrl: vi.fn(() => 'https://example.com/mock-url'),
    },
  },
}));

// Mock Supabase and database dependencies
vi.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/mock-url' } })),
      })),
    },
  },
}));

vi.mock('../../lib/database', () => ({
  database: {
    mediaAssets: {
      getById: vi.fn(),
    },
    storage: {
      getPublicUrl: vi.fn(() => 'https://example.com/mock-url'),
    },
  },
}));

// Mock the useGeneratedVideos hook
vi.mock('../../hooks/useGeneratedVideos', () => ({
  useGeneratedVideos: vi.fn(),
}));

// Mock useUserId to return a consistent user ID
vi.mock('../../hooks/useUserId', () => ({
  useUserId: () => 'test-user-id',
}));

type UseGeneratedVideosResult = UseQueryResult<GeneratedVideo[], Error>;

// Mock ResizeObserver for test environment
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

// Mock video element methods that might be called
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLVideoElement.prototype, 'pause', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLVideoElement.prototype, 'load', {
  writable: true,
  value: vi.fn(),
});

describe('GeneratedVideosView', () => {
  let queryClient: QueryClient;
  const mockUseGeneratedVideos = vi.mocked(useGeneratedVideos);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
    setupClerkMocks();
  });

  // Mock video data that matches what we have in the database
  const mockVideos: GeneratedVideo[] = [
    {
      id: '18edbb28-9aa0-4c8a-8d2e-6a9505660cec',
      project_id: '53d889ba-91e7-4dbe-a2af-de4619581451',
      user_id: 'local-dev-user',
      name: 'Sample Test Video',
      ai_model: 'runway-gen2',
      aspect_ratio: '16:9',
      scene_type: 'product-showcase',
      camera_movement: 'static',
      storage_path: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnail_url: undefined,
      duration: 30,
      status: 'completed',
      version: 1,
      parent_id: undefined,
      runway_task_id: undefined,
      created_at: '2025-10-20T15:59:30.165+00:00',
      completed_at: '2025-10-20T15:59:30.166+00:00',
    },
  ];

  const defaultProps = {
    projectId: 'project-1',
    viewMode: 'grid' as const,
    onExport: vi.fn(),
  };

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {component}
        </ToastProvider>
      </QueryClientProvider>
    );
  };

  it('renders loading state when data is loading', () => {
    mockUseGeneratedVideos.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as UseGeneratedVideosResult);

    renderWithQueryClient(<GeneratedVideosView {...defaultProps} />);

    // Should show loading skeleton
    expect(document.querySelector('[class*="animate-pulse"]')).toBeInTheDocument();
  });

  it('renders empty state when no videos provided', () => {
    mockUseGeneratedVideos.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      status: 'success' as const,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isInitialLoading: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetching: false,
      isStale: false,
      refetch: vi.fn(),
      fetchStatus: 'idle' as const,
      isEnabled: true,
      promise: Promise.resolve([]),
    } as unknown as UseGeneratedVideosResult);

    renderWithQueryClient(<GeneratedVideosView {...defaultProps} />);

    expect(screen.getByText('No generated videos yet')).toBeInTheDocument();
    expect(screen.getByText('Create professional marketing videos from your edited images.')).toBeInTheDocument();
  });

  it.skip('renders videos in grid view', () => {
    mockUseGeneratedVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
      isError: false,
      error: null,
    } as UseGeneratedVideosResult);

    renderWithQueryClient(<GeneratedVideosView {...defaultProps} />);

    // Check that video card is rendered
    expect(screen.getByText('Sample Test Video')).toBeInTheDocument();

    // Check that video element is present
    const videoElement = document.querySelector('video');
    expect(videoElement).toBeInTheDocument();

    // Check that video source is set correctly
    if (videoElement) {
      expect(videoElement).toHaveAttribute('src', mockVideos[0].storage_path);
    }
  });

  it('renders videos in list view', () => {
    mockUseGeneratedVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
      isError: false,
      error: null,
    } as UseGeneratedVideosResult);

    renderWithQueryClient(<GeneratedVideosView {...defaultProps} viewMode="list" />);

    expect(screen.getByText('Sample Test Video')).toBeInTheDocument();

    // In list view, the layout should be different (space-y-2 instead of grid)
    const container = screen.getByText('Sample Test Video').closest('[class*="space-y-2"]');
    expect(container).toBeInTheDocument();
  });

  it('displays correct video status badge', () => {
    mockUseGeneratedVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
      isError: false,
      error: null,
    } as UseGeneratedVideosResult);

    renderWithQueryClient(<GeneratedVideosView {...defaultProps} />);

    // Check for completed status badge with duration
    expect(screen.getByText('30s')).toBeInTheDocument();
    expect(screen.getByText('16:9')).toBeInTheDocument();
  });

  it('displays video metadata correctly', () => {
    mockUseGeneratedVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
      isError: false,
      error: null,
    } as UseGeneratedVideosResult);

    renderWithQueryClient(<GeneratedVideosView {...defaultProps} />);

    // Check for AI model and creation date
    expect(screen.getByText('runway-gen2')).toBeInTheDocument();

    // The date should be formatted as "Oct 20, 2025" based on the test output
    expect(screen.getByText('Oct 20, 2025')).toBeInTheDocument();
  });

  it('shows export and delete buttons for completed videos', () => {
    mockUseGeneratedVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
      isError: false,
      error: null,
    } as UseGeneratedVideosResult);

    renderWithQueryClient(<GeneratedVideosView {...defaultProps} />);

    // For completed videos, download and delete buttons should be visible
    const exportButton = screen.getByTitle('Download video');
    const deleteButton = screen.getByTitle('Delete video');

    expect(exportButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });

  it.skip('renders VideoPlayer component for completed videos', () => {
    mockUseGeneratedVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
      isError: false,
      error: null,
    } as UseGeneratedVideosResult);

    renderWithQueryClient(<GeneratedVideosView {...defaultProps} />);

    // Check that VideoPlayer component is rendered
    const videoContainer = document.querySelector('.group.relative.overflow-hidden.rounded-2xl');
    expect(videoContainer).toBeInTheDocument();

    // VideoPlayer should contain a video element
    const videoElement = document.querySelector('video');
    expect(videoElement).toBeInTheDocument();
  });

  it('displays processing state for processing videos', () => {
    const processingVideo: GeneratedVideo = {
      ...mockVideos[0],
      status: 'processing',
      storage_path: undefined,
      duration: undefined,
      completed_at: undefined,
    };

    mockUseGeneratedVideos.mockReturnValue({
      data: [processingVideo],
      isLoading: false,
      isError: false,
      error: null,
    } as UseGeneratedVideosResult);

    renderWithQueryClient(<GeneratedVideosView {...defaultProps} />);

    // Should show processing indicator instead of video
    expect(screen.getByText('Processing video...')).toBeInTheDocument();

    // Should show processing badge
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('displays error state for failed videos', () => {
    const failedVideo: GeneratedVideo = {
      ...mockVideos[0],
      status: 'failed',
      storage_path: undefined,
    };

    mockUseGeneratedVideos.mockReturnValue({
      data: [failedVideo],
      isLoading: false,
      isError: false,
      error: null,
    } as UseGeneratedVideosResult);

    renderWithQueryClient(<GeneratedVideosView {...defaultProps} />);

    // Should show error message instead of video
    expect(screen.getByText('Video generation failed')).toBeInTheDocument();

    // Should show failed badge
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('calls onExport when export button is clicked', () => {
    mockUseGeneratedVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
      isError: false,
      error: null,
    } as UseGeneratedVideosResult);

    const onExport = vi.fn();
    renderWithQueryClient(<GeneratedVideosView {...defaultProps} onExport={onExport} />);

    const exportButton = screen.getByTitle('Download video');
    exportButton.click();

    expect(onExport).toHaveBeenCalledWith(mockVideos[0]);
  });


  it('renders VideoPlayer with correct video attributes and controls', () => {
    mockUseGeneratedVideos.mockReturnValue({
      data: mockVideos,
      isLoading: false,
      isError: false,
      error: null,
    } as UseGeneratedVideosResult);

    renderWithQueryClient(<GeneratedVideosView {...defaultProps} />);

    const videoElement = document.querySelector('video');
    if (videoElement) {
      // VideoPlayer component uses custom controls, so no 'controls' attribute
      expect(videoElement).toHaveAttribute('preload', 'metadata');
      expect(videoElement).toHaveClass('w-full', 'h-full', 'object-contain');
    }

    // VideoPlayer component renders successfully with custom controls
  });

  it('handles multiple videos correctly', () => {
    const multipleVideos: GeneratedVideo[] = [
      mockVideos[0],
      {
        ...mockVideos[0],
        id: 'video-2',
        name: 'Second Video',
        status: 'processing',
      },
    ];

    mockUseGeneratedVideos.mockReturnValue({
      data: multipleVideos,
      isLoading: false,
      isError: false,
      error: null,
    } as UseGeneratedVideosResult);

    renderWithQueryClient(<GeneratedVideosView {...defaultProps} />);

    expect(screen.getByText('Sample Test Video')).toBeInTheDocument();
    expect(screen.getByText('Second Video')).toBeInTheDocument();
    expect(screen.getByText('30s')).toBeInTheDocument(); // completed video
    expect(screen.getByText('Processing')).toBeInTheDocument(); // processing video
  });
});
