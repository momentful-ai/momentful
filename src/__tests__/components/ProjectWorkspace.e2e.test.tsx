import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectWorkspace } from '../../components/ProjectWorkspace';
import { database } from '../../lib/database';
import * as RunwayAPI from '../../services/aiModels/runway';
import { EditedImage, MediaAsset } from '../../types';

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
    },
    generatedVideos: {
      list: vi.fn(),
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
  let mockOnSave: ReturnType<typeof vi.fn>;

  const mockProject = {
    id: 'test-project',
    user_id: 'test-user-id',
    name: 'Test Project',
    description: 'Test description',
    thumbnail_url: null,
    created_at: '2025-10-20T15:59:30.165+00:00',
    updated_at: '2025-10-20T15:59:30.165+00:00',
    previewImages: [],
  };

  const mockEditedImage: EditedImage = {
    id: 'edited-image-1',
    project_id: 'test-project',
    user_id: 'test-user-id',
    source_asset_id: null,
    prompt: 'A beautiful landscape',
    context: {},
    ai_model: 'stable-diffusion',
    storage_path: 'edited-images/edited-image-1.jpg',
    edited_url: 'https://example.com/edited-images/edited-image-1.jpg',
    thumbnail_url: null,
    width: 512,
    height: 512,
    version: 1,
    parent_id: undefined,
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
    video_url: 'https://example.com/generated-video-1.mp4',
    thumbnail_url: undefined,
    duration: 30,
    status: 'completed' as const,
    version: 1,
    parent_id: undefined,
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
    mockOnSave = vi.fn();

    // Reset all mocks
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(database.editedImages.list).mockResolvedValue([mockEditedImage]);
    vi.mocked(database.mediaAssets.list).mockResolvedValue(mockMediaAssets);
    vi.mocked(database.generatedVideos.list).mockResolvedValue([]); // Start with no videos
    vi.mocked(database.generatedVideos.create).mockResolvedValue(mockGeneratedVideo);

    // Mock the videos list to return the new video after creation
    let videosListCallCount = 0;
    vi.mocked(database.generatedVideos.list).mockImplementation(async (projectId: string) => {
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
      />
    );

    // Step 1: Verify initial state - should show Media Library tab by default
    expect(screen.getByText('Media Library')).toBeInTheDocument();
    expect(screen.getByText('Edited Images')).toBeInTheDocument();
    expect(screen.getByText('Generated Videos')).toBeInTheDocument();

    // Step 2: Click "Generate Video" button to open VideoGenerator
    // The button should have a Video icon - use role and text together for specificity
    const generateButton = screen.getByRole('button', { name: /generate video/i });
    // Ensure this is the main project button (not inside VideoGenerator yet)
    expect(generateButton).toBeInTheDocument();
    expect(generateButton).toHaveTextContent('Generate Video');
    await userEvent.click(generateButton);

    // Step 3: VideoGenerator should open and show edited images
    // Wait for VideoGenerator to be present by checking for a unique element
    await waitFor(() => {
      // The VideoGenerator should be rendered, which means we should have 2 "Generate Video" buttons now
      const generateButtons = screen.getAllByText('Generate Video');
      expect(generateButtons.length).toBe(2);
    });

    // Step 4: Switch to Edited Images tab in the generator
    // Need to be specific - there are now 2 "Edited Images" tabs (main project and VideoGenerator)
    const editedImagesTabs = screen.getAllByText('Edited Images');
    // Click the one inside VideoGenerator (should be the second one)
    const videoGeneratorTab = editedImagesTabs[1];
    await userEvent.click(videoGeneratorTab);

    // Step 5: Select the edited image by clicking on it
    await waitFor(() => {
      const imageElement = screen.getByAltText('A beautiful landscape');
      expect(imageElement).toBeInTheDocument();
    });

    const imageElement = screen.getByAltText('A beautiful landscape');
    await userEvent.click(imageElement);

    // Step 6: Click "Generate Video" in the generator
    // Need to be specific - there are now two Generate Video buttons
    await waitFor(() => {
      const generateButtons = screen.getAllByText('Generate Video');
      expect(generateButtons.length).toBeGreaterThanOrEqual(2);
    });

    const allGenerateButtons = screen.getAllByText('Generate Video');
    // Click the one inside VideoGenerator - it should be the second one (index 1)
    // since the first one is the main project button
    const videoGeneratorButton = allGenerateButtons[1];
    await userEvent.click(videoGeneratorButton);

    // Step 7: Verify Runway API was called
    await waitFor(() => {
      expect(vi.mocked(RunwayAPI.createRunwayJob)).toHaveBeenCalledWith({
        mode: 'image-to-video',
        promptImage: mockEditedImage.edited_url,
        promptText: undefined, // No prompt entered
      });
    });

    // Step 8: Verify video was saved to database with correct payload
    await waitFor(() => {
      expect(vi.mocked(database.generatedVideos.create)).toHaveBeenCalledWith({
        project_id: 'test-project',
        user_id: 'test-user-id',
        name: 'Untitled Video', // Empty prompt becomes 'Untitled Video'
        ai_model: 'runway-gen2', // Default selected model
        aspect_ratio: '16:9', // Default aspect ratio
        scene_type: 'product-showcase', // Default scene type
        camera_movement: 'static', // Default camera movement
        runway_task_id: 'runway-task-123',
        video_url: 'https://example.com/generated-video-1.mp4',
        storage_path: 'https://example.com/generated-video-1.mp4',
        status: 'completed',
        completed_at: '2025-10-20T15:59:30.165Z',
      });
    });

    // Step 9: The VideoGenerator should close and trigger onSave callback
    // This should close the generator and refresh the project data
    await waitFor(() => {
      expect(screen.queryByText('Video Generator')).not.toBeInTheDocument();
    });

    // Step 10: Now switch to the Generated Videos tab
    const videosTab = screen.getByText('Generated Videos');
    await userEvent.click(videosTab);

    // Step 11: Verify the video appears in the Generated Videos tab
    await waitFor(() => {
      expect(screen.getByText('Untitled Video')).toBeInTheDocument();
      expect(screen.getByText('runway-gen2')).toBeInTheDocument();
      expect(screen.getByText('16:9')).toBeInTheDocument();
      expect(screen.getByText('30s')).toBeInTheDocument();
    });

    // Step 12: Verify the video element is rendered with correct source
    const videoElement = document.querySelector('video');
    expect(videoElement).toBeInTheDocument();
    expect(videoElement).toHaveAttribute('src', mockGeneratedVideo.storage_path);

    // Step 13: Verify export and publish buttons are visible for completed video
    const exportButton = screen.getByTitle('Export video');
    const publishButton = screen.getByTitle('Publish to social');
    expect(exportButton).toBeInTheDocument();
    expect(publishButton).toBeInTheDocument();

    // Step 14: Verify the complete data flow worked
    // The database.generatedVideos.list should have been called during the refresh
    expect(vi.mocked(database.generatedVideos.list)).toHaveBeenCalledWith('test-project');

    // Step 15: Verify the video generation process completed successfully
    expect(vi.mocked(RunwayAPI.pollJobStatus)).toHaveBeenCalledWith(
      'runway-task-123',
      expect.any(Function)
    );
  });

  it('shows processing state and updates when video completes', async () => {
    // Mock a processing video first
    const processingVideo = {
      ...mockGeneratedVideo,
      id: 'processing-video-1',
      status: 'processing' as const,
      storage_path: null,
      video_url: null,
      duration: null,
      completed_at: null,
    };

    vi.mocked(database.generatedVideos.list).mockResolvedValue([processingVideo]);

    renderWithQueryClient(
      <ProjectWorkspace
        project={mockProject}
        onBack={mockOnBack}
        onUpdateProject={mockOnUpdateProject}
        onEditImage={mockOnEditImage}
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

    // Export and publish buttons should not be visible for processing videos
    const exportButton = screen.queryByTitle('Export video');
    const publishButton = screen.queryByTitle('Publish to social');
    expect(exportButton).not.toBeInTheDocument();
    expect(publishButton).not.toBeInTheDocument();
  });

  it('handles video generation errors gracefully', async () => {
    // Mock Runway API to fail
    vi.mocked(RunwayAPI.createRunwayJob).mockRejectedValue(new Error('Runway API error'));

    renderWithQueryClient(
      <ProjectWorkspace
        project={mockProject}
        onBack={mockOnBack}
        onUpdateProject={mockOnUpdateProject}
        onEditImage={mockOnEditImage}
      />
    );

    // Open VideoGenerator - be specific about which button
    const generateButtons = screen.getAllByText('Generate Video');
    const mainGenerateButton = generateButtons.find(button =>
      button.closest('[class*="mb-8"]') // The main generate button is in the header section
    );
    expect(mainGenerateButton).toBeInTheDocument();
    await userEvent.click(mainGenerateButton!);

    // Select image
    await waitFor(() => {
      const imageElement = screen.getByAltText('A beautiful landscape');
      expect(imageElement).toBeInTheDocument();
    });

    const imageElement = screen.getByAltText('A beautiful landscape');
    await userEvent.click(imageElement);

    // Try to generate video - need to be specific about which button (inside VideoGenerator)
    await waitFor(() => {
      const buttons = screen.getAllByText('Generate Video');
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    const allButtons = screen.getAllByText('Generate Video');
    // Click the one inside VideoGenerator - it should be the second one (index 1)
    // since the first one is the main project button
    const videoGeneratorButton = allButtons[1];
    await userEvent.click(videoGeneratorButton);

    // Video generation should fail and generator should remain open
    await waitFor(() => {
      // The VideoGenerator should still be open, so we should still have 2 "Generate Video" buttons
      const generateButtons = screen.getAllByText('Generate Video');
      expect(generateButtons.length).toBe(2);
    });

    // Should not have called database.create
    expect(vi.mocked(database.generatedVideos.create)).not.toHaveBeenCalled();

    // Should not have called onSave - VideoGenerator should still be open
    // Since onSave closes the VideoGenerator, if it's still open, onSave was not called
    expect(screen.getByText('Video Generator')).toBeInTheDocument();
  });
});
