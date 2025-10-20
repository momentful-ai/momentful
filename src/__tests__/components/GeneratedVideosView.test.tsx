import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GeneratedVideosView } from '../../components/GeneratedVideosView';
import { GeneratedVideo } from '../../types';

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

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
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
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnail_url: null,
      duration: 30,
      status: 'completed',
      version: 1,
      parent_id: null,
      runway_task_id: null,
      created_at: '2025-10-20T15:59:30.165+00:00',
      completed_at: '2025-10-20T15:59:30.166+00:00',
    },
  ];

  const defaultProps = {
    videos: mockVideos,
    viewMode: 'grid' as const,
    onExport: vi.fn(),
    onPublish: vi.fn(),
  };

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('renders empty state when no videos provided', () => {
    renderWithQueryClient(<GeneratedVideosView {...defaultProps} videos={[]} />);

    expect(screen.getByText('No generated videos yet')).toBeInTheDocument();
    expect(screen.getByText('Create professional marketing videos from your edited images.')).toBeInTheDocument();
  });

  it('renders videos in grid view', () => {
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
    renderWithQueryClient(<GeneratedVideosView {...defaultProps} viewMode="list" />);

    expect(screen.getByText('Sample Test Video')).toBeInTheDocument();

    // In list view, the layout should be different (space-y-2 instead of grid)
    const container = screen.getByText('Sample Test Video').closest('[class*="space-y-2"]');
    expect(container).toBeInTheDocument();
  });

  it('displays correct video status badge', () => {
    renderWithQueryClient(<GeneratedVideosView {...defaultProps} />);

    // Check for completed status badge with duration
    expect(screen.getByText('30s')).toBeInTheDocument();
    expect(screen.getByText('16:9')).toBeInTheDocument();
  });

  it('displays video metadata correctly', () => {
    renderWithQueryClient(<GeneratedVideosView {...defaultProps} />);

    // Check for AI model and creation date
    expect(screen.getByText('runway-gen2')).toBeInTheDocument();

    // The date should be formatted as "Oct 20, 2025" based on the test output
    expect(screen.getByText('Oct 20, 2025')).toBeInTheDocument();
  });

  it('shows export and publish buttons for completed videos', () => {
    renderWithQueryClient(<GeneratedVideosView {...defaultProps} />);

    // For completed videos, export and publish buttons should be visible
    const exportButton = screen.getByTitle('Export video');
    const publishButton = screen.getByTitle('Publish to social');

    expect(exportButton).toBeInTheDocument();
    expect(publishButton).toBeInTheDocument();
  });

  it('handles video loading errors gracefully', async () => {
    // Mock console.error to capture error logs
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithQueryClient(<GeneratedVideosView {...defaultProps} />);

    const videoElement = document.querySelector('video');
    if (videoElement) {
      // Simulate a video loading error
      const errorEvent = new Event('error');
      videoElement.dispatchEvent(errorEvent);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Video failed to load:', expect.anything());
      });
    }

    consoleSpy.mockRestore();
  });

  it('displays processing state for processing videos', () => {
    const processingVideo: GeneratedVideo = {
      ...mockVideos[0],
      status: 'processing',
      storage_path: null,
      video_url: null,
      duration: null,
      completed_at: null,
    };

    renderWithQueryClient(<GeneratedVideosView {...defaultProps} videos={[processingVideo]} />);

    // Should show processing indicator instead of video
    expect(screen.getByText('Processing video...')).toBeInTheDocument();

    // Should show processing badge
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('displays error state for failed videos', () => {
    const failedVideo: GeneratedVideo = {
      ...mockVideos[0],
      status: 'failed',
      storage_path: null,
      video_url: null,
    };

    renderWithQueryClient(<GeneratedVideosView {...defaultProps} videos={[failedVideo]} />);

    // Should show error message instead of video
    expect(screen.getByText('Video generation failed')).toBeInTheDocument();

    // Should show failed badge
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('calls onExport when export button is clicked', () => {
    const onExport = vi.fn();
    renderWithQueryClient(<GeneratedVideosView {...defaultProps} onExport={onExport} />);

    const exportButton = screen.getByTitle('Export video');
    exportButton.click();

    expect(onExport).toHaveBeenCalledWith(mockVideos[0]);
  });

  it('calls onPublish when publish button is clicked', () => {
    const onPublish = vi.fn();
    renderWithQueryClient(<GeneratedVideosView {...defaultProps} onPublish={onPublish} />);

    const publishButton = screen.getByTitle('Publish to social');
    publishButton.click();

    expect(onPublish).toHaveBeenCalledWith(mockVideos[0]);
  });

  it('renders video with correct attributes', () => {
    renderWithQueryClient(<GeneratedVideosView {...defaultProps} />);

    const videoElement = document.querySelector('video');
    if (videoElement) {
      expect(videoElement).toHaveAttribute('controls');
      expect(videoElement).toHaveAttribute('preload', 'metadata');
      expect(videoElement).toHaveClass('w-full', 'h-full', 'object-contain');
    }
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

    renderWithQueryClient(<GeneratedVideosView {...defaultProps} videos={multipleVideos} />);

    expect(screen.getByText('Sample Test Video')).toBeInTheDocument();
    expect(screen.getByText('Second Video')).toBeInTheDocument();
    expect(screen.getByText('30s')).toBeInTheDocument(); // completed video
    expect(screen.getByText('Processing')).toBeInTheDocument(); // processing video
  });
});
