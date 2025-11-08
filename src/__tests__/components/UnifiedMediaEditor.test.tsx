import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { UnifiedMediaEditor } from '../../components/UnifiedMediaEditor';
import { database } from '../../lib/database';
import * as RunwayAPI from '../../services/aiModels/runway';
import * as ReplicateAPI from '../../services/aiModels/replicate/api-client';
import { EditedImage, MediaAsset } from '../../types';
import { useUserId } from '../../hooks/useUserId';
import { useToast } from '../../hooks/useToast';
import { useEditedImages } from '../../hooks/useEditedImages';
import { useMediaAssets } from '../../hooks/useMediaAssets';
import { useEditedImagesByLineage } from '../../hooks/useEditedImages';
import {
  mockSupabase,
  createTestQueryClient,
  createTestRenderer,
  createMockEditedImage,
  createMockMediaAsset,
  createUserEvent,
} from '../test-utils.tsx';

// Setup global mocks
vi.mock('../../hooks/useUserId', () => ({ useUserId: vi.fn(() => 'test-user-id') }));
vi.mock('../../hooks/useToast', () => ({ useToast: vi.fn(() => ({ showToast: vi.fn() })) }));
vi.mock('../../hooks/useEditedImages', () => ({
  useEditedImages: vi.fn(),
  useEditedImagesByLineage: vi.fn(),
}));
vi.mock('../../hooks/useMediaAssets', () => ({ useMediaAssets: vi.fn() }));

// Mock environment
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

Object.defineProperty(HTMLVideoElement.prototype, 'play', { writable: true, value: vi.fn() });
Object.defineProperty(HTMLVideoElement.prototype, 'pause', { writable: true, value: vi.fn() });
Object.defineProperty(HTMLVideoElement.prototype, 'load', { writable: true, value: vi.fn() });

// Mock external dependencies
vi.mock('../../lib/database', () => ({
  database: {
    editedImages: { create: vi.fn() },
    mediaAssets: { list: vi.fn(), create: vi.fn() },
    generatedVideos: { create: vi.fn() },
    videoSources: { create: vi.fn() },
    storage: {
      getPublicUrl: vi.fn((bucket: string, path: string) => `https://example.com/${bucket}/${path}`),
      upload: vi.fn(),
    },
  },
}));

vi.mock('../../lib/media', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/media')>();
  return {
    ...actual,
    isAcceptableImageFile: vi.fn((file: File) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
    ),
    buildEnhancedImagePrompt: vi.fn((productName: string) => productName),
    buildEnhancedVideoPrompt: vi.fn((prompt: string, cameraMovement: string) =>
      `${prompt}. Use ${cameraMovement}, intelligent camera movements that highlight the product effectively.`
    ),
    IMAGE_ASPECT_RATIOS: [
      { id: 'square', label: 'Square', width: 512, height: 512 },
      { id: 'landscape', label: 'Landscape', width: 768, height: 512 },
    ],
  };
});

vi.mock('../../services/aiModels/replicate/api-client', () => ({
  createReplicateImageJob: vi.fn(),
  pollReplicatePrediction: vi.fn(),
  extractImageUrl: vi.fn(),
}));

vi.mock('../../services/aiModels/runway', () => ({
  createRunwayJob: vi.fn(),
  pollJobStatus: vi.fn(),
}));

mockSupabase();

// Mock accessors
const mockUseUserId = vi.mocked(useUserId);
const mockUseToast = vi.mocked(useToast);
const mockUseEditedImages = vi.mocked(useEditedImages);
const mockUseEditedImagesByLineage = vi.mocked(useEditedImagesByLineage);
const mockUseMediaAssets = vi.mocked(useMediaAssets);

// Test constants
const TEST_PROJECT_ID = 'test-project';
const TEST_USER_ID = 'test-user-id';

// Helper functions for common test patterns
const createMockQueryResult = (data: unknown, isLoading = false, isError = false) => {
  return {
    data,
    isLoading,
    isError,
    error: null,
    isPending: isLoading,
    isLoadingError: false,
    isRefetchError: false,
    isSuccess: !isLoading && !isError,
    status: isLoading ? 'pending' : isError ? 'error' : 'success',
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
    refetch: vi.fn(),
    fetchStatus: 'idle' as const,
    // Additional properties required by UseQueryResult
    isPlaceholderData: false,
    isInitialLoading: isLoading,
    isPaused: false,
    isEnabled: true,
    promise: undefined,
  };
};

const setupFileDropMocks = () => {
  const ImageConstructor = global.Image;
  global.Image = class extends Image {
    width = 800;
    height = 600;
    constructor() {
      super();
      queueMicrotask(() => {
        if (this.onload) this.onload({} as Event);
      });
    }
  } as typeof Image;

  // Ensure URL.createObjectURL exists and mock it
  if (!global.URL) global.URL = {} as typeof global.URL;
  if (!global.URL.createObjectURL) {
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  }
  const createObjectURLSpy = vi.spyOn(global.URL, 'createObjectURL').mockReturnValue('blob:mock-url');

  return { ImageConstructor, createObjectURLSpy };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const restoreFileDropMocks = (ImageConstructor: typeof Image, createObjectURLSpy: any) => {
  global.Image = ImageConstructor;
  createObjectURLSpy.mockRestore();
};

const createMockFile = (name = 'test-image.jpg', type = 'image/jpeg') =>
  new File(['image content'], name, { type });

const createDataTransfer = (files: File[]) => ({
  files: files as unknown as FileList,
  types: ['Files'],
  items: files.map(file => ({
    kind: 'file',
    type: file.type,
    getAsFile: () => file,
  })) as unknown as DataTransferItemList,
  dropEffect: 'copy',
  effectAllowed: 'copy',
  clearData: vi.fn(),
  getData: vi.fn(),
  setData: vi.fn(),
});

const setupMocks = () => {
  const mockEditedImages = [createMockEditedImage()];
  const mockMediaAssets = [createMockMediaAsset()];
  const mockShowToast = vi.fn();

  // Reset mocks
  vi.clearAllMocks();

  // Setup hook mocks
  mockUseUserId.mockReturnValue(TEST_USER_ID);
  mockUseToast.mockReturnValue({ showToast: mockShowToast });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseEditedImages.mockReturnValue(createMockQueryResult(mockEditedImages) as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseEditedImagesByLineage.mockReturnValue(createMockQueryResult([]) as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseMediaAssets.mockReturnValue(createMockQueryResult(mockMediaAssets) as any);

  // Setup API mocks
  vi.mocked(database.editedImages.create).mockResolvedValue(mockEditedImages[0]);
  vi.mocked(database.generatedVideos.create).mockResolvedValue({
    id: 'generated-video-1',
    project_id: TEST_PROJECT_ID,
    user_id: TEST_USER_ID,
    name: 'Test Video',
    ai_model: 'runway-gen2',
    aspect_ratio: '9:16',
    camera_movement: 'dynamic',
    storage_path: 'https://example.com/generated-video.mp4',
    status: 'completed',
    runway_task_id: 'runway-task-123',
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });

  vi.mocked(database.videoSources.create).mockResolvedValue({
    id: 'video-source-1',
    video_id: 'generated-video-1',
    source_type: 'edited_image',
    source_id: 'edited-image-1',
    sort_order: 0,
  });

  // Replicate API
  vi.mocked(ReplicateAPI.createReplicateImageJob).mockResolvedValue({
    id: 'replicate-prediction-123',
    status: 'starting',
  });
  vi.mocked(ReplicateAPI.pollReplicatePrediction).mockResolvedValue({
    id: 'replicate-prediction-123',
    status: 'succeeded',
    output: ['https://example.com/generated-image.png'],
    created_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });
  vi.mocked(ReplicateAPI.extractImageUrl).mockReturnValue('https://example.com/generated-image.png');

  // Runway API
  vi.mocked(RunwayAPI.createRunwayJob).mockResolvedValue({
    taskId: 'runway-task-123',
    status: 'PROCESSING',
  });
  vi.mocked(RunwayAPI.pollJobStatus).mockResolvedValue({
    id: 'runway-task-123',
    status: 'SUCCEEDED',
    output: 'https://example.com/generated-video.mp4',
  });

  // Mock fetch to prevent network calls during image downloading
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    blob: () => Promise.resolve(new Blob(['mock image data'], { type: 'image/png' })),
  });

  return { mockEditedImages, mockMediaAssets, mockShowToast };
};

const renderComponent = (props: Partial<React.ComponentProps<typeof UnifiedMediaEditor>> = {}) => {
  const defaultProps = {
    projectId: TEST_PROJECT_ID,
    onClose: vi.fn(),
    onSave: vi.fn(),
    initialMode: 'image-edit' as const, // Provide required default
  };

  const finalProps = { ...defaultProps, ...props };
  renderWithQueryClient(<UnifiedMediaEditor {...finalProps} />);

  return finalProps;
};

const waitForComponent = async (expectedText = 'Edited Images') => {
  await waitFor(() => expect(screen.getByText(expectedText)).toBeInTheDocument());
  expect(document.querySelector('div.h-screen')).toBeInTheDocument();
};

// Test-level variables
let queryClient: QueryClient;
let renderWithQueryClient: ReturnType<typeof createTestRenderer>;
let mockEditedImages: EditedImage[];
let mockMediaAssets: MediaAsset[];
let mockShowToast: ReturnType<typeof vi.fn>;

describe('UnifiedMediaEditor', () => {
  beforeEach(() => {
    queryClient = createTestQueryClient();
    renderWithQueryClient = createTestRenderer(queryClient);

    const mocks = setupMocks();
    mockEditedImages = mocks.mockEditedImages;
    mockMediaAssets = mocks.mockMediaAssets;
    mockShowToast = mocks.mockShowToast;
  });

  describe('Initial Rendering', () => {
    it('renders in image-edit mode without crashing', async () => {
      renderComponent({ initialMode: 'image-edit', asset: mockMediaAssets[0] });
      await waitForComponent();
    });

    it('renders in video-generate mode without crashing', async () => {
      renderComponent({ initialMode: 'video-generate' });
      await waitForComponent();
    });

    it('loads edited images and media assets on mount', async () => {
      renderComponent({ initialMode: 'image-edit', asset: mockMediaAssets[0] });

      await waitFor(() => {
        expect(mockUseEditedImages).toHaveBeenCalledWith(TEST_PROJECT_ID);
        expect(mockUseMediaAssets).toHaveBeenCalledWith(TEST_PROJECT_ID);
      });
    });

    it('pre-selects image when initialSelectedImageId is provided in video mode', async () => {
      renderComponent({ initialMode: 'video-generate', initialSelectedImageId: 'edited-image-1' });

      await waitFor(() => {
        expect(mockUseEditedImages).toHaveBeenCalledWith(TEST_PROJECT_ID);
      });

      await waitForComponent();
    });
  });

  describe('Mode Switching', () => {
    it('switches from image-edit to video-generate mode', async () => {
      const user = createUserEvent();
      renderComponent({ initialMode: 'image-edit', asset: mockMediaAssets[0] });
      await waitForComponent();

      const modeButtons = document.querySelectorAll('button[class*="gap-2"]');
      await user.click(modeButtons[1]); // Video mode button

      await waitForComponent();
    });

    it('switches from video-generate to image-edit mode', async () => {
      const user = createUserEvent();
      renderComponent({ initialMode: 'video-generate' });
      await waitForComponent();

      const modeButtons = document.querySelectorAll('button[class*="gap-2"]');
      await user.click(modeButtons[0]); // Image mode button

      await waitForComponent();
    });
  });

  describe('Image Editing Workflow', () => {
    it.skip('handles complete image editing workflow with Replicate API', async () => {
      const user = createUserEvent();
      const { onSave } = renderComponent({ initialMode: 'image-edit', asset: mockMediaAssets[0] });
      await waitForComponent();

      const promptInput = screen.getByPlaceholderText(/Product name.*Shoes.*Candle.*Mug/i);
      await user.clear(promptInput);
      await user.type(promptInput, 'Beautiful Shoes');

      const generateButton = screen.getByText('Edit Image With AI');
      await user.click(generateButton);

      await waitFor(() => {
        expect(vi.mocked(ReplicateAPI.createReplicateImageJob)).toHaveBeenCalledWith({
          imageUrl: `https://example.com/user-uploads/${mockMediaAssets[0].storage_path}`,
          prompt: 'Beautiful Shoes',
          aspectRatio: 'square',
        });
        expect(vi.mocked(ReplicateAPI.pollReplicatePrediction)).toHaveBeenCalled();
        expect(vi.mocked(database.editedImages.create)).toHaveBeenCalled();
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });

    it.skip('shows comparison view after image generation', async () => {
      const user = createUserEvent();
      const { onSave } = renderComponent({ initialMode: 'image-edit', asset: mockMediaAssets[0] });
      await waitForComponent();

      const promptInput = screen.getByPlaceholderText(/Product name.*Shoes.*Candle.*Mug/i);
      await user.clear(promptInput);
      await user.type(promptInput, 'Test Product');

      const generateButton = screen.getByText('Edit Image With AI');
      await user.click(generateButton);

      await waitFor(() => expect(onSave).toHaveBeenCalled());
    });
  });

  describe('Video Generation Workflow', () => {
    it('handles complete video generation workflow with Runway API', async () => {
      const user = createUserEvent();
      const { onSave } = renderComponent({ initialMode: 'video-generate' });
      await waitForComponent();

      // Switch to Edited Images tab
      const editedImagesTab = screen.getByText('Edited Images');
      await user.click(editedImagesTab);

      await waitFor(() => {
        const imageElement = screen.getByAltText('A beautiful landscape');
        expect(imageElement).toBeInTheDocument();
      });

      const imageElement = screen.getByAltText('A beautiful landscape');
      await user.click(imageElement);

      const promptInput = screen.getByPlaceholderText(/Describe your video vision/i);
      await user.clear(promptInput);
      await user.type(promptInput, 'Dynamic product showcase');

      const generateButton = screen.getByText('Generate Video');
      await user.click(generateButton);

      await waitFor(() => {
        expect(vi.mocked(RunwayAPI.createRunwayJob)).toHaveBeenCalledWith({
          mode: 'image-to-video',
          promptImage: mockEditedImages[0].edited_url,
          promptText: 'Dynamic product showcase. Use dynamic, intelligent camera movements that highlight the product effectively.',
          ratio: '720:1280', // 9:16 aspect ratio mapped to Runway format
        });
        expect(vi.mocked(RunwayAPI.pollJobStatus)).toHaveBeenCalled();
        expect(vi.mocked(database.generatedVideos.create)).toHaveBeenCalled();
        expect(vi.mocked(database.videoSources.create)).toHaveBeenCalled();
        expect(onSave).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('File Drop Functionality', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mocks: { ImageConstructor: typeof Image; createObjectURLSpy: any };

    beforeEach(() => {
      mocks = setupFileDropMocks();
    });

    afterEach(() => {
      restoreFileDropMocks(mocks.ImageConstructor, mocks.createObjectURLSpy);
    });

    it.skip('handles file drop and uploads images in video mode', async () => {
      const mockFile = createMockFile();
      const mockUpload = vi.mocked(database.storage.upload);
      const mockCreate = vi.mocked(database.mediaAssets.create);

      mockUpload.mockResolvedValue({
        id: 'upload-id-1',
        path: `${TEST_USER_ID}/${TEST_PROJECT_ID}/${Date.now()}-test-image.jpg`,
        fullPath: `${TEST_USER_ID}/${TEST_PROJECT_ID}/${Date.now()}-test-image.jpg`,
      });
      mockCreate.mockResolvedValue({
        id: 'new-media-asset-1',
        project_id: TEST_PROJECT_ID,
        user_id: TEST_USER_ID,
        file_name: 'test-image.jpg',
        file_type: 'image',
        file_size: mockFile.size,
        storage_path: `user-uploads/${TEST_USER_ID}/${TEST_PROJECT_ID}/123-test-image.jpg`,
        thumbnail_url: null,
        width: 800,
        height: 600,
        duration: undefined,
        sort_order: 1,
        created_at: new Date().toISOString(),
      });

      const { container } = renderWithQueryClient(
        <UnifiedMediaEditor
          initialMode="video-generate"
          projectId={TEST_PROJECT_ID}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Edited Images')).toBeInTheDocument();
      });

      const contentArea = container.querySelector('aside div.flex-1.overflow-y-auto');
      expect(contentArea).toBeInTheDocument();

      fireEvent.drop(contentArea!, { dataTransfer: createDataTransfer([mockFile]) });

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(
          'user-uploads',
          expect.stringMatching(new RegExp(`${TEST_USER_ID}/${TEST_PROJECT_ID}/\\d+-test-image\\.jpg`)),
          mockFile
        );
        expect(mockCreate).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('Error Handling', () => {
    it('handles Replicate API error during image generation', async () => {
      const user = createUserEvent();
      vi.mocked(ReplicateAPI.createReplicateImageJob).mockRejectedValue(new Error('API Error'));

      renderComponent({ initialMode: 'image-edit', asset: mockMediaAssets[0] });
      await waitForComponent();

      const promptInput = screen.getByPlaceholderText(/Product name.*Shoes.*Candle.*Mug/i);
      await user.clear(promptInput);
      await user.type(promptInput, 'Test Product');

      const generateButton = screen.getByText('Edit Image With AI');
      await user.click(generateButton);

      await waitFor(() => {
        const errorCalls = mockShowToast.mock.calls.filter(call => call[1] === 'error');
        expect(errorCalls.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it('handles Runway API error during video generation', async () => {
      const user = createUserEvent();
      vi.mocked(RunwayAPI.createRunwayJob).mockRejectedValue(new Error('API Error'));

      renderComponent({ initialMode: 'video-generate' });
      await waitForComponent();

      const editedImagesTab = screen.getByText('Edited Images');
      await user.click(editedImagesTab);

      await waitFor(() => screen.getByAltText('A beautiful landscape'));
      await user.click(screen.getByAltText('A beautiful landscape'));

      const generateButton = screen.getByText('Generate Video');
      await user.click(generateButton);

      await waitFor(() => {
        const errorCalls = mockShowToast.mock.calls.filter(call => call[1] === 'error');
        expect(errorCalls.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it('requires product name for image generation', async () => {
      const user = createUserEvent();
      renderComponent({ initialMode: 'image-edit', asset: mockMediaAssets[0] });
      await waitForComponent();

      const promptInput = screen.getByPlaceholderText(/Product name.*Shoes.*Candle.*Mug/i);
      await user.clear(promptInput);

      const generateButton = screen.getByText('Edit Image With AI');
      await user.click(generateButton);

      expect(vi.mocked(ReplicateAPI.createReplicateImageJob)).not.toHaveBeenCalled();
    });

    it.skip('requires selected image for video generation', async () => {
      const user = createUserEvent();
      renderComponent({ initialMode: 'video-generate' });
      await waitForComponent();

      const generateButton = screen.getByText('Generate Video');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Please select at least one image to generate a video',
          'warning'
        );
      });

      expect(vi.mocked(RunwayAPI.createRunwayJob)).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('allows image selection in image-edit mode', async () => {
      renderComponent({ initialMode: 'image-edit', asset: mockMediaAssets[0] });
      await waitForComponent();

      // Component should handle image selection without errors
      expect(document.querySelector('div.h-screen')).toBeInTheDocument();
    });

    it('allows source selection in video-generate mode', async () => {
      const user = createUserEvent();
      renderComponent({ initialMode: 'video-generate' });
      await waitForComponent();

      const editedImagesTab = screen.getByText('Edited Images');
      await user.click(editedImagesTab);

      await waitFor(() => screen.getByAltText('A beautiful landscape'));
      await user.click(screen.getByAltText('A beautiful landscape'));

      // Should show selection indicator
      await waitFor(() => {
        const selectedIndicator = document.querySelector('[class*="bg-primary"][class*="rounded-full"]');
        expect(selectedIndicator).toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    it('loads editing history when sourceEditedImage has lineage', async () => {
      const mockSourceEditedImage = createMockEditedImage({
        id: 'source-edited-image',
        lineage_id: 'test-lineage-id',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUseEditedImagesByLineage.mockReturnValue(createMockQueryResult([mockSourceEditedImage]) as any);

      renderComponent({
        initialMode: 'image-edit',
        sourceEditedImage: mockSourceEditedImage
      });

      await waitFor(() => {
        expect(mockUseEditedImagesByLineage).toHaveBeenCalledWith('test-lineage-id');
      });
    });

    it('pre-selects sourceEditedImage in image-edit mode', async () => {
      const mockSourceEditedImage = createMockEditedImage({
        id: 'source-edited-image',
        prompt: 'Test prompt for pre-selection',
      });

      renderComponent({
        initialMode: 'image-edit',
        sourceEditedImage: mockSourceEditedImage
      });
      await waitForComponent();

      const promptInput = screen.getByPlaceholderText(/Product name.*Shoes.*Candle.*Mug/i) as HTMLInputElement;
      expect(promptInput.value).toBe('Test prompt for pre-selection');
    });
  });
});
