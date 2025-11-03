/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ImageEditor } from '../../components/ImageEditor';
import { MediaAsset, EditedImage } from '../../types';
import { database } from '../../lib/database';
import * as ReplicateAPI from '../../services/aiModels/replicate/api-client';

// Mock ResizeObserver for test environment
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

// Mock Image constructor to simulate image loading
global.Image = class Image {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 1920;
  height = 1080;
  src = '';

  constructor() {
    // Simulate successful image load
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
} as unknown as typeof Image;

// Mock fetch for image downloads
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    blob: () => Promise.resolve(new Blob(['fake-image-data'], { type: 'image/png' })),
  } as Response)
);

// Mock the database module
vi.mock('../../lib/database', () => ({
  database: {
    editedImages: {
      create: vi.fn(),
      list: vi.fn(() => Promise.resolve([])),
      listBySourceAsset: vi.fn(() => Promise.resolve([])),
    },
    storage: {
      getPublicUrl: vi.fn((bucket, path) => `https://example.com/${bucket}/${path}`),
      upload: vi.fn(() => Promise.resolve({ path: 'user-uploads/test-user-id/test-project/generated-image.png' })),
    },
  },
}));

// Mock the Replicate API client
vi.mock('../../services/aiModels/replicate/api-client', () => ({
  createReplicateImageJob: vi.fn(),
  pollReplicatePrediction: vi.fn(),
  extractImageUrl: vi.fn(),
}));

// Mock the hooks
vi.mock('../../hooks/useUserId', () => ({
  useUserId: vi.fn(() => 'test-user-id'),
}));

vi.mock('../../hooks/useEditedImages', () => ({
  useEditedImagesBySource: vi.fn(),
}));

import { useUserId } from '../../hooks/useUserId';
import { useEditedImagesBySource } from '../../hooks/useEditedImages';
const mockUseUserId = vi.mocked(useUserId);
const mockUseEditedImagesBySource = vi.mocked(useEditedImagesBySource);

const mockShowToast = vi.fn();
vi.mock('../../hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    showToast: mockShowToast,
  })),
}));

// Helper functions to consolidate repeated test logic
const createUser = () => userEvent.setup();

const findPromptInput = () => screen.getByPlaceholderText(/Product name/);

const findGenerateButton = () => screen.getByRole('button', { name: /Edit Image With AI/i });

const findEditImageButton = () => screen.getByText("Edit Image With AI");

const generateImage = async (user: ReturnType<typeof userEvent.setup>, prompt: string, useEditButton = false) => {
  const promptInput = findPromptInput();
  await user.type(promptInput, prompt);
  const button = useEditButton ? findEditImageButton() : findGenerateButton();
  await user.click(button);
};

const waitForGenerationComplete = async (timeout = 5000) => {
  await waitFor(
    () => {
      expect(database.editedImages.create).toHaveBeenCalled();
    },
    { timeout }
  );
};

const waitForApiCall = async (apiCall: any, timeout = 5000) => {
  await waitFor(
    () => {
      expect(apiCall).toHaveBeenCalled();
    },
    { timeout }
  );
};

const setupDefaultMocks = () => {
  vi.clearAllMocks();
  mockUseUserId.mockReturnValue('test-user-id');
  mockUseEditedImagesBySource.mockReturnValue({
    data: [],
    isLoading: false,
  } as any);
};

describe('ImageEditor', () => {
  let queryClient: QueryClient;
  let mockOnClose: ReturnType<typeof vi.fn>;
  let mockOnSave: ReturnType<typeof vi.fn>;

  const mockAsset: MediaAsset = {
    id: 'asset-1',
    project_id: 'test-project',
    user_id: 'test-user-id',
    file_name: 'test-image.jpg',
    file_type: 'image',
    file_size: 1024000,
    storage_path: 'user-uploads/test-user-id/test-project/test-image.jpg',
    thumbnail_url: undefined,
    width: 1920,
    height: 1080,
    duration: undefined,
    sort_order: 1,
    created_at: '2025-10-20T15:59:30.165+00:00',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockOnClose = vi.fn();
    mockOnSave = vi.fn();

    // Reset all mocks
    setupDefaultMocks();

    // Setup default mock implementations
    vi.mocked(database.editedImages.create).mockResolvedValue({
      id: 'edited-image-1',
      project_id: 'test-project',
      user_id: 'test-user-id',
      prompt: 'Test prompt',
      context: {},
      ai_model: 'flux-pro',
      storage_path: 'user-uploads/test-user-id/test-project/edited-1234567890.png',
      edited_url: 'https://example.com/user-uploads/user-uploads/test-user-id/test-project/edited-1234567890.png',
      width: 1920,
      height: 1080,
      version: 1,
      parent_id: null,
      created_at: '2025-10-20T15:59:30.165+00:00',
    });

    // Mock Replicate API functions
    vi.mocked(ReplicateAPI.createReplicateImageJob).mockResolvedValue({
      id: 'prediction-123',
      status: 'starting',
    });

    vi.mocked(ReplicateAPI.pollReplicatePrediction).mockResolvedValue({
      id: 'prediction-123',
      status: 'succeeded',
      output: ['https://example.com/generated-image.png'],
      logs: '',
      metrics: {},
      created_at: new Date().toISOString(),
    });

    vi.mocked(ReplicateAPI.extractImageUrl).mockReturnValue('https://example.com/generated-image.png');
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div>Loading...</div>}>
          {component}
        </Suspense>
      </QueryClientProvider>
    );
  };

  describe('Initial Rendering', () => {
    it('renders without crashing', async () => {
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      expect(await screen.findByText('Image Editor')).toBeInTheDocument();
      expect(screen.getByText('Back to Project')).toBeInTheDocument();
    });

    it('displays the source image', async () => {
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      const image = await screen.findByAltText('test-image.jpg');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute(
        'src',
        'https://example.com/user-uploads/user-uploads/test-user-id/test-project/test-image.jpg'
      );
    });

    it('displays edited image as source when sourceEditedImage is provided', async () => {
      const mockEditedImage: EditedImage = {
        id: 'edited-1',
        project_id: 'test-project',
        user_id: 'test-user-id',
        prompt: 'Make it more vibrant',
        context: {},
        ai_model: 'flux-pro',
        storage_path: 'user-uploads/test-user-id/test-project/edited-1.png',
        edited_url: 'https://example.com/edited-image.png',
        width: 1920,
        height: 1080,
        version: 1,
        parent_id: undefined,
        source_asset_id: 'asset-1',
        created_at: '2025-10-20T16:00:00.000+00:00',
      };

      // When sourceEditedImage is provided, the hook should be called with source_asset_id
      mockUseEditedImagesBySource.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      renderWithQueryClient(
        <ImageEditor
          asset={mockAsset}
          projectId="test-project"
          onClose={mockOnClose}
          onSave={mockOnSave}
          sourceEditedImage={mockEditedImage}
        />
      );

      const image = await screen.findByAltText('test-image.jpg');
      expect(image).toBeInTheDocument();
      // Should use the edited image URL instead of the asset's storage_path
      expect(image).toHaveAttribute('src', 'https://example.com/edited-image.png');

      // Verify that useEditedImagesBySource was called with the source_asset_id
      expect(mockUseEditedImagesBySource).toHaveBeenCalledWith(mockEditedImage.source_asset_id);
    });

    it('falls back to asset storage_path when sourceEditedImage has no edited_url', async () => {
      const mockEditedImageWithoutUrl: EditedImage = {
        id: 'edited-1',
        project_id: 'test-project',
        user_id: 'test-user-id',
        prompt: 'Make it more vibrant',
        context: {},
        ai_model: 'flux-pro',
        storage_path: 'user-uploads/test-user-id/test-project/edited-1.png',
        edited_url: '', // Empty URL
        width: 1920,
        height: 1080,
        version: 1,
        parent_id: undefined,
        source_asset_id: 'asset-1',
        created_at: '2025-10-20T16:00:00.000+00:00',
      };

      renderWithQueryClient(
        <ImageEditor 
          asset={mockAsset} 
          projectId="test-project" 
          onClose={mockOnClose} 
          onSave={mockOnSave}
          sourceEditedImage={mockEditedImageWithoutUrl}
        />
      );

      const image = await screen.findByAltText('test-image.jpg');
      expect(image).toBeInTheDocument();
      // Should fall back to asset's storage_path
      expect(image).toHaveAttribute(
        'src',
        'https://example.com/user-uploads/user-uploads/test-user-id/test-project/test-image.jpg'
      );
    });

    it('displays aspect ratio selection controls', async () => {
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnSave} onSave={mockOnSave} />
      );

      expect(await screen.findByText('Aspect Ratio')).toBeInTheDocument();
      expect(screen.getByText('16:9')).toBeInTheDocument();
      expect(screen.getByText('9:16')).toBeInTheDocument();
      expect(screen.getByText('1:1')).toBeInTheDocument();
    });

    it('defaults to first aspect ratio option', async () => {
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // The first ratio (16:9 / 1280:720) should be selected by default
      const ratioButtons = await screen.findAllByText('16:9');
      expect(ratioButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Aspect Ratio Selection', () => {
    it('allows user to select different aspect ratios', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Find and click the 1:1 ratio button
      const squareRatio = screen.getByText('1:1');
      await user.click(squareRatio);

      // The button should now be selected (check for selected styling)
      await waitFor(() => {
        const selectedButton = squareRatio.closest('button');
        expect(selectedButton).toHaveClass('border-primary');
      });
    });
  });

  describe('Image Generation Workflow', () => {
    it('validates that prompt is required before generating', async () => {
      const user = createUser();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Find the Generate button (it's in a button element)
      const generateButton = findGenerateButton();
      expect(generateButton).toBeDisabled();

      // Enter a prompt
      const promptInput = findPromptInput();
      await user.type(promptInput, 'Make it look professional');

      // Now the button should be enabled
      await waitFor(() => {
        expect(generateButton).not.toBeDisabled();
      });
    });

    it('calls Runway API with correct parameters including ratio', async () => {
      const user = createUser();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Select a different aspect ratio
      const squareRatio = screen.getByText('1:1');
      await user.click(squareRatio);

      // Enter prompt and generate
      await generateImage(user, 'Add a gradient background');

      // Verify Replicate API was called with correct parameters
      await waitForApiCall(ReplicateAPI.createReplicateImageJob);
      expect(ReplicateAPI.createReplicateImageJob).toHaveBeenCalledWith({
        imageUrl: 'https://example.com/user-uploads/user-uploads/test-user-id/test-project/test-image.jpg',
        prompt: expect.stringContaining('keep the Add a gradient background exactly the same'),
        aspectRatio: '1024:1024',
      });
    });

    it('uses default ratio (16:9) when no ratio is explicitly selected', async () => {
      const user = createUser();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Enter prompt and generate (without changing ratio)
      await generateImage(user, 'Enhance the colors');

      // Verify Replicate API was called with default aspect ratio (720:1280)
      await waitForApiCall(ReplicateAPI.createReplicateImageJob);
      expect(ReplicateAPI.createReplicateImageJob).toHaveBeenCalledWith(
        expect.objectContaining({
          aspectRatio: '720:1280',
        })
      );
    });


    it('polls for job completion and extracts image URL', async () => {
      const user = createUser();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Enter prompt and generate
      await generateImage(user, 'Test prompt');

      // Verify polling was called
      await waitForApiCall(ReplicateAPI.pollReplicatePrediction);
      expect(ReplicateAPI.pollReplicatePrediction).toHaveBeenCalledWith(
        'prediction-123',
        expect.any(Function),
        120,
        2000
      );

      // Verify image URL extraction
      expect(ReplicateAPI.extractImageUrl).toHaveBeenCalled();
    });

    it('uploads generated image to storage and saves to database immediately', async () => {
      const user = createUser();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Enter prompt and generate
      await generateImage(user, 'Test prompt');

      // Wait for image to be generated and uploaded
      await waitFor(
        () => {
          expect(database.storage.upload).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );

      // Verify the edited image is saved to database immediately after upload
      await waitForGenerationComplete();

      // Verify the comparison view is shown
      await waitFor(() => {
        expect(screen.getByText('Original')).toBeInTheDocument();
        expect(screen.getByText('AI Edited')).toBeInTheDocument();
      });

      // Verify success toast indicates both generation and save
      expect(mockShowToast).toHaveBeenCalledWith('Image generated and saved successfully!', 'success');

      // Verify onSave callback IS called to notify parent, but editor stays open (onClose not called)
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('calls onSave when image is saved but editor stays open', async () => {
      const user = createUser();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Generate an image (which automatically saves)
      await generateImage(user, 'Test prompt');

      // Wait for generation and automatic save to complete
      await waitForGenerationComplete();
      expect(mockOnSave).toHaveBeenCalled();

      // Verify onSave was called to notify parent, but editor stays open (onClose not called)
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('includes source_asset_id when creating edited image', async () => {
      const user = createUser();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Enter prompt and generate
      await generateImage(user, 'Test prompt');

      // Wait for image to be saved
      await waitFor(
        () => {
          expect(database.editedImages.create).toHaveBeenCalledWith(
            expect.objectContaining({
              source_asset_id: mockAsset.id,
            })
          );
        },
        { timeout: 5000 }
      );
    });

    it('optimistically updates query cache immediately after image creation', async () => {
      const user = createUser();
      const createdImage = {
        id: 'edited-image-1',
        project_id: 'test-project',
        user_id: 'test-user-id',
        prompt: 'Test prompt',
        context: {},
        ai_model: 'flux-pro',
        storage_path: 'user-uploads/test-user-id/test-project/edited-1234567890.png',
        edited_url: 'https://example.com/user-uploads/user-uploads/test-user-id/test-project/edited-1234567890.png',
        width: 1920,
        height: 1080,
        version: 1,
        parent_id: null,
        source_asset_id: mockAsset.id,
        created_at: '2025-10-20T15:59:30.165+00:00',
        lineage_id: 'lineage-1',
      };

      vi.mocked(database.editedImages.create).mockResolvedValue(createdImage);

      // Mock listBySourceAsset to return the created image (simulating refetch result)
      vi.mocked(database.editedImages.listBySourceAsset).mockResolvedValue([createdImage]);

      // Mock list to return the created image (for project-wide query)
      vi.mocked(database.editedImages.list).mockResolvedValue([createdImage]);

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Enter prompt and generate
      await generateImage(user, 'Test prompt');

      // Wait for image creation to complete
      await waitForGenerationComplete();

      // Verify setQueryData was called for optimistic updates
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['edited-images', 'source', mockAsset.id],
        expect.any(Function)
      );
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['edited-images', 'test-project'],
        expect.any(Function)
      );

      // Wait for refetch to complete and verify cache contains the image
      await waitFor(
        () => {
          const sourceCacheData = queryClient.getQueryData(['edited-images', 'source', mockAsset.id]);
          const projectCacheData = queryClient.getQueryData(['edited-images', 'test-project']);

          expect(sourceCacheData).toBeDefined();
          expect(projectCacheData).toBeDefined();

          if (Array.isArray(sourceCacheData) && sourceCacheData.length > 0) {
            expect(sourceCacheData[0]).toMatchObject({
              id: createdImage.id,
              prompt: createdImage.prompt,
            });
          }
          if (Array.isArray(projectCacheData) && projectCacheData.length > 0) {
            expect(projectCacheData[0]).toMatchObject({
              id: createdImage.id,
              prompt: createdImage.prompt,
            });
          }
        },
        { timeout: 5000 }
      );
    });

    it('invalidates and refetches edited images queries after creation', async () => {
      const user = createUser();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const refetchSpy = vi.spyOn(queryClient, 'refetchQueries');

      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Enter prompt and generate
      await generateImage(user, 'Test prompt');

      // Wait for image creation to complete
      await waitForGenerationComplete();

      // Verify invalidateQueries was called for project and source queries
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['edited-images', 'test-project'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['edited-images', 'source', mockAsset.id] });

      // Verify refetchQueries was called for active queries
      expect(refetchSpy).toHaveBeenCalledWith({ queryKey: ['edited-images', 'test-project'] });
      expect(refetchSpy).toHaveBeenCalledWith({ queryKey: ['edited-images', 'source', mockAsset.id] });
    });

    it('invalidates timeline queries when lineage_id is present', async () => {
      const user = createUser();
      const createdImageWithLineage = {
        id: 'edited-image-1',
        project_id: 'test-project',
        user_id: 'test-user-id',
        prompt: 'Test prompt',
        context: {},
        ai_model: 'flux-pro',
        storage_path: 'user-uploads/test-user-id/test-project/edited-1234567890.png',
        edited_url: 'https://example.com/user-uploads/user-uploads/test-user-id/test-project/edited-1234567890.png',
        width: 1920,
        height: 1080,
        version: 1,
        parent_id: null,
        source_asset_id: mockAsset.id,
        created_at: '2025-10-20T15:59:30.165+00:00',
        lineage_id: 'lineage-123',
      };

      vi.mocked(database.editedImages.create).mockResolvedValue(createdImageWithLineage);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Enter prompt and generate
      await generateImage(user, 'Test prompt');

      // Wait for image creation to complete
      await waitForGenerationComplete();

      // Verify timeline queries were invalidated
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['timeline', 'lineage-123'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['timelines', 'test-project'] });
    });

    it('does not invalidate timeline queries when lineage_id is missing', async () => {
      const user = createUser();
      const createdImageWithoutLineage = {
        id: 'edited-image-1',
        project_id: 'test-project',
        user_id: 'test-user-id',
        prompt: 'Test prompt',
        context: {},
        ai_model: 'flux-pro',
        storage_path: 'user-uploads/test-user-id/test-project/edited-1234567890.png',
        edited_url: 'https://example.com/user-uploads/user-uploads/test-user-id/test-project/edited-1234567890.png',
        width: 1920,
        height: 1080,
        version: 1,
        parent_id: null,
        source_asset_id: mockAsset.id,
        created_at: '2025-10-20T15:59:30.165+00:00',
        lineage_id: undefined,
      };

      vi.mocked(database.editedImages.create).mockResolvedValue(createdImageWithoutLineage);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Enter prompt and generate
      await generateImage(user, 'Test prompt');

      // Wait for image creation to complete
      await waitForGenerationComplete();

      // Verify timeline query with lineage_id was NOT called
      expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['timeline', expect.any(String)] });

      // But project timelines should still be invalidated
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['timelines', 'test-project'] });
    });

    it('fetches editing history for the source asset', async () => {
      const mockHistory = [
        {
          id: 'edited-1',
          project_id: 'test-project',
          user_id: 'test-user-id',
          prompt: 'Previous edit',
          context: {},
          ai_model: 'flux-pro',
          storage_path: 'path/to/edited-1.png',
          edited_url: 'https://example.com/edited-1.png',
          width: 1920,
          height: 1080,
          version: 1,
          source_asset_id: mockAsset.id,
          created_at: '2025-10-20T15:59:30.165+00:00',
        },
      ];

      // Mock the hook to return the history data
      mockUseEditedImagesBySource.mockReturnValue({
        data: mockHistory,
        isLoading: false,
      } as any);

      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Wait for history to load
      await waitFor(() => {
        expect(mockUseEditedImagesBySource).toHaveBeenCalledWith(mockAsset.id);
      });

      // Verify history is displayed
      await waitFor(() => {
        expect(screen.getByText(/Editing History/)).toBeInTheDocument();
      });
    });

    it('shows warning when save fails during generation', async () => {
      const user = createUser();

      // Mock initial save failure
      vi.mocked(database.editedImages.create).mockRejectedValueOnce(new Error('Database error'));

      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Generate an image (save will fail)
      await generateImage(user, 'Test prompt', true);

      // Wait for generation to complete (save will fail but generation succeeds)
      // The error message will be the actual error message from the mock
      await waitFor(
        () => {
          expect(mockShowToast).toHaveBeenCalledWith(
            'Database error',
            'warning'
          );
        },
        { timeout: 5000 }
      );

      // Verify onSave was NOT called when save fails
      expect(mockOnSave).not.toHaveBeenCalled();

      // Verify comparison view is still shown
      expect(screen.getByText('Original')).toBeInTheDocument();
      expect(screen.getByText('AI Edited')).toBeInTheDocument();
    });

    it('asserts project_id is never empty when saving edited image', async () => {
      const user = createUser();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project-id" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Enter prompt and generate
      await generateImage(user, 'Test prompt', true);

      // Wait for save to be called
      await waitForGenerationComplete();

      // Verify project_id is present and not empty in the payload
      const createCall = vi.mocked(database.editedImages.create).mock.calls[0][0];
      expect(createCall.project_id).toBeDefined();
      expect(createCall.project_id).toBe('test-project-id');
      expect(createCall.project_id.trim()).not.toBe('');
      expect(createCall.project_id.length).toBeGreaterThan(0);
    });

    it('throws error when projectId is empty string', async () => {
      const user = createUser();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Enter prompt and generate
      await generateImage(user, 'Test prompt', true);

      // Wait for generation to complete, then check for error during save
      // The image will be generated successfully, but save will fail due to empty projectId
      await waitFor(
        () => {
          // Check if toast was called with error message about Project ID
          const toastCalls = mockShowToast.mock.calls;
          const hasProjectIdError = toastCalls.some(
            call => call[0]?.includes('Project ID is required') && call[1] === 'error'
          );
          expect(hasProjectIdError).toBe(true);
        },
        { timeout: 10000 }
      );

      // Verify database.create was NOT called (validation prevents it)
      expect(database.editedImages.create).not.toHaveBeenCalled();
    });

    it('validates user is logged in before generation', async () => {
      const user = createUser();
      // Mock useUserId to return null (not logged in) from the start
      // This will prevent generation, but we can still test the save validation
      mockUseUserId.mockReturnValue(null);

      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Try to generate image - this should fail due to missing userId
      await generateImage(user, 'Test prompt', true);

      // Verify error toast is shown for generation
      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('User must be logged in to generate images', 'error');
      });

      // Reset mock for other tests
      mockUseUserId.mockReturnValue('test-user-id');
    });

  });

  describe('Error Handling', () => {
    it('shows error toast when Replicate API fails', async () => {
      const user = createUser();
      vi.mocked(ReplicateAPI.createReplicateImageJob).mockRejectedValue(new Error('API Error'));

      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      await generateImage(user, 'Test prompt', true);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('API Error', 'error');
      });
    });

    it('shows error toast when image URL extraction fails', async () => {
      const user = createUser();
      vi.mocked(ReplicateAPI.extractImageUrl).mockReturnValue(null);

      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      await generateImage(user, 'Test prompt', true);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Failed to extract image URL from Replicate response',
          'error'
        );
      });
    });

  });

  describe('Version History', () => {
    it('tracks version history after generating images', async () => {
      const user = createUser();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Generate first image
      await generateImage(user, 'First version', true);

      // Wait for generation to complete
      await waitFor(
        () => {
          expect(screen.getByText('Version History')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Verify version history shows the first version
      expect(screen.getByText('Version 1')).toBeInTheDocument();
      // Use getAllByText since the prompt might appear in multiple places
      const firstVersionPrompts = screen.getAllByText('First version');
      expect(firstVersionPrompts.length).toBeGreaterThan(0);
    });

    it('correctly uses source_asset_id for editing history when sourceEditedImage is provided', async () => {
      const mockEditedImage: EditedImage = {
        id: 'edited-1',
        project_id: 'test-project',
        user_id: 'test-user-id',
        prompt: 'Make it more vibrant',
        context: {},
        ai_model: 'flux-pro',
        storage_path: 'user-uploads/test-user-id/test-project/edited-1.png',
        edited_url: 'https://example.com/edited-image.png',
        width: 1920,
        height: 1080,
        version: 1,
        parent_id: undefined,
        source_asset_id: 'different-source-asset-id',
        created_at: '2025-10-20T16:00:00.000+00:00',
      };

      renderWithQueryClient(
        <ImageEditor
          asset={mockAsset}
          projectId="test-project"
          onClose={mockOnClose}
          onSave={mockOnSave}
          sourceEditedImage={mockEditedImage}
        />
      );

      // Verify that useEditedImagesBySource was called with the source_asset_id from the edited image,
      // not the asset.id (which would be 'asset-1')
      await waitFor(() => {
        expect(mockUseEditedImagesBySource).toHaveBeenCalledWith('different-source-asset-id');
      });
    });
  });
});

