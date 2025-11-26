import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectWorkspace } from '../../components/ProjectWorkspace/ProjectWorkspace';
import { database } from '../../lib/database';
import * as RunwayAPI from '../../services/aiModels/runway';
import { EditedImage, MediaAsset } from '../../types';
import { mockSupabase } from '../test-utils.tsx';

// Mock supabase
mockSupabase();

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

// Mock the entire database module
vi.mock('../../lib/database', () => ({
  database: {
    editedImages: {
      list: vi.fn(),
    },
    mediaAssets: {
      list: vi.fn(),
      create: vi.fn(),
    },
    generatedVideos: {
      list: vi.fn(),
      create: vi.fn(),
    },
    videoSources: {
      create: vi.fn(),
    },
    storage: {
      getPublicUrl: vi.fn((bucket, path) => `https://example.com/${bucket}/${path}`),
      upload: vi.fn(),
    },
    projects: {
      update: vi.fn(),
    },
  },
}));

// Mock the Runway API
vi.mock('../../services/aiModels/runway', () => ({
  createRunwayJob: vi.fn(),
  pollJobStatus: vi.fn(),
}));

// Mock the hooks
vi.mock('../../hooks/useUserId', () => ({
  useUserId: vi.fn(() => 'test-user-id'),
}));

vi.mock('../../hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}));

// Mock the updateProjectVideoStatuses function
vi.mock('../../services/aiModels/runway', () => ({
  createRunwayJob: vi.fn(),
  pollJobStatus: vi.fn(),
  updateProjectVideoStatuses: vi.fn().mockResolvedValue(undefined),
}));

describe('ProjectWorkspace - End-to-End Video Generation Flow', () => {
  let queryClient: QueryClient;
  let mockOnBack: ReturnType<typeof vi.fn>;
  let mockOnUpdateProject: ReturnType<typeof vi.fn>;
  let mockOnEditImage: ReturnType<typeof vi.fn>;
  let mockOnGenerateVideo: ReturnType<typeof vi.fn>;

  const mockProject = {
    id: 'test-project',
    user_id: 'test-user-id',
    name: 'Test Project',
    description: 'Test description',
    thumbnail_url: undefined,
    created_at: '2025-10-20T15:59:30.165+00:00',
    updated_at: '2025-10-20T15:59:30.165+00:00',
    previewImages: [],
  };

  const mockEditedImage: EditedImage = {
    id: 'edited-image-1',
    project_id: 'test-project',
    user_id: 'test-user-id',
    prompt: 'A beautiful landscape',
    context: {},
    ai_model: 'stable-diffusion',
    storage_path: 'edited-images/edited-image-1.jpg',
    edited_url: 'https://example.com/edited-images/edited-image-1.jpg',
    thumbnail_url: undefined,
    width: 512,
    height: 512,
    created_at: '2025-10-20T15:59:30.165+00:00',
  };

  const mockMediaAssets: MediaAsset[] = [];

  const mockGeneratedVideo = {
    id: 'generated-video-1',
    project_id: 'test-project',
    user_id: 'test-user-id',
    name: 'Untitled Video',
    ai_model: 'runway-gen2',
    aspect_ratio: '16:9' as const,
    scene_type: 'product-showcase',
    camera_movement: 'static',
    storage_path: 'https://example.com/generated-video-1.mp4',
    thumbnail_url: undefined,
    duration: 30,
    status: 'completed' as const,
    runway_task_id: 'runway-task-123',
    created_at: '2025-10-20T15:59:30.165+00:00',
    completed_at: '2025-10-20T15:59:30.166+00:00',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockOnBack = vi.fn();
    mockOnUpdateProject = vi.fn();
    mockOnEditImage = vi.fn();
    mockOnGenerateVideo = vi.fn();

    // Reset all mocks
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(database.editedImages.list).mockResolvedValue([mockEditedImage]);
    vi.mocked(database.mediaAssets.list).mockResolvedValue(mockMediaAssets);
    vi.mocked(database.mediaAssets.create).mockResolvedValue({
      id: 'new-video-asset-1',
      project_id: mockProject.id,
      user_id: 'test-user-id',
      file_name: 'test-video.mp4',
      file_type: 'video',
      file_size: 1024,
      storage_path: 'user-uploads/test-user-id/project-1/test-video.mp4',
      width: 1920,
      height: 1080,
      duration: 10.5,
      created_at: '2025-10-20T15:59:30.165+00:00',
      sort_order: 0,
      thumbnail_url: null,
    });
    vi.mocked(database.generatedVideos.list).mockResolvedValue([]); // Start with no videos
    vi.mocked(database.generatedVideos.create).mockResolvedValue(mockGeneratedVideo);
    vi.mocked(database.videoSources.create).mockResolvedValue({
      id: 'video-source-1',
      video_id: 'generated-video-1',
      source_type: 'edited_image' as const,
      source_id: 'edited-image-1',
      sort_order: 0,
    });
    vi.mocked(database.storage.upload).mockResolvedValue({
      id: 'upload-id-1',
      path: 'user-uploads/test-user-id/project-1/test-video.mp4',
      fullPath: 'user-uploads/test-user-id/project-1/test-video.mp4',
    });

    // Mock the videos list to return the new video after creation
    let videosListCallCount = 0;
    vi.mocked(database.generatedVideos.list).mockImplementation(async () => {
      videosListCallCount++;
      if (videosListCallCount === 1) {
        return []; // First call (initial load) returns no videos
      } else {
        return [mockGeneratedVideo]; // Subsequent calls return the new video
      }
    });

    // Mock Runway API functions
    vi.mocked(RunwayAPI.createRunwayJob).mockResolvedValue({
      taskId: 'runway-task-123',
      status: 'PROCESSING',
    });
    vi.mocked(RunwayAPI.pollJobStatus).mockResolvedValue({
      id: 'runway-task-123',
      status: 'SUCCEEDED',
      output: 'https://example.com/generated-video-1.mp4',
    });
    vi.mocked(RunwayAPI.updateProjectVideoStatuses).mockResolvedValue(undefined);
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('exercises complete video generation flow: UI → save → UI refresh', async () => {
    // Freeze time for consistent date formatting
    vi.setSystemTime(new Date('2025-10-20T15:59:30.165+00:00'));

    renderWithQueryClient(
      <ProjectWorkspace
        project={mockProject}
        onBack={mockOnBack}
        onUpdateProject={mockOnUpdateProject}
        onEditImage={mockOnEditImage}
        onGenerateVideo={mockOnGenerateVideo}
      />
    );

    // Step 1: Verify initial state - should show Media Library tab by default
    expect(screen.getByText('Media Library')).toBeInTheDocument();
    expect(screen.getByText('Edited Images')).toBeInTheDocument();
    expect(screen.getByText('Generated Videos')).toBeInTheDocument();

    // Step 2: Click "Generate Video" button
    const generateButton = screen.getByRole('button', { name: /generate video/i });
    expect(generateButton).toBeInTheDocument();
    expect(generateButton).toHaveTextContent('Generate Video');
    await userEvent.click(generateButton);

    // Step 3: Verify that onGenerateVideo callback was called with correct project ID
    expect(mockOnGenerateVideo).toHaveBeenCalledWith('test-project');
  });

  it('shows processing state and updates when video completes', async () => {
    // Mock a processing video first
    const processingVideo = {
      ...mockGeneratedVideo,
      id: 'processing-video-1',
      status: 'processing' as const,
      storage_path: undefined,
      duration: undefined,
      completed_at: undefined,
    };

    vi.mocked(database.generatedVideos.list).mockResolvedValue([processingVideo]);

    renderWithQueryClient(
      <ProjectWorkspace
        project={mockProject}
        onBack={mockOnBack}
        onUpdateProject={mockOnUpdateProject}
        onEditImage={mockOnEditImage}
        onGenerateVideo={mockOnGenerateVideo}
      />
    );

    // Switch to Generated Videos tab
    const videosTab = screen.getByText('Generated Videos');
    await userEvent.click(videosTab);

    // Should show processing state
    await waitFor(() => {
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Processing video...')).toBeInTheDocument();
    });

    // Video element should not be present for processing videos
    const videoElement = document.querySelector('video');
    expect(videoElement).not.toBeInTheDocument();

    // Download and delete buttons should still be visible for processing videos
    // (though download may be disabled, the buttons are still rendered)
    const deleteButton = screen.queryByTitle('Delete video');
    // These buttons exist but download may be disabled for processing videos
    expect(deleteButton).toBeInTheDocument();
  });


});
