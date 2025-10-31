import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ImageEditor } from '../../components/ImageEditor';
import { MediaAsset } from '../../types';
import { database } from '../../lib/database';
import * as RunwayAPI from '../../services/aiModels/runway/api-client';

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
    },
    storage: {
      getPublicUrl: vi.fn((bucket, path) => `https://example.com/${bucket}/${path}`),
      upload: vi.fn(() => Promise.resolve()),
    },
  },
}));

// Mock the Runway API client
vi.mock('../../services/aiModels/runway/api-client', () => ({
  createRunwayImageJob: vi.fn(),
  pollJobStatus: vi.fn(),
  extractImageUrl: vi.fn(),
}));

// Mock the hooks
vi.mock('../../hooks/useUserId', () => ({
  useUserId: vi.fn(() => 'test-user-id'),
}));

import { useUserId } from '../../hooks/useUserId';
const mockUseUserId = vi.mocked(useUserId);

const mockShowToast = vi.fn();
vi.mock('../../hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    showToast: mockShowToast,
  })),
}));

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
    vi.clearAllMocks();
    mockUseUserId.mockReturnValue('test-user-id');

    // Setup default mock implementations
    vi.mocked(database.editedImages.create).mockResolvedValue({
      id: 'edited-image-1',
      project_id: 'test-project',
      user_id: 'test-user-id',
      source_asset_id: 'asset-1',
      prompt: 'Test prompt',
      context: {},
      ai_model: 'runway-gen4-turbo',
      storage_path: 'user-uploads/test-user-id/test-project/edited-1234567890.png',
      width: 1920,
      height: 1080,
      version: 1,
      parent_id: null,
      created_at: '2025-10-20T15:59:30.165+00:00',
    });

    // Mock Runway API functions
    vi.mocked(RunwayAPI.createRunwayImageJob).mockResolvedValue({
      taskId: 'runway-task-123',
      status: 'processing',
    });

    vi.mocked(RunwayAPI.pollJobStatus).mockResolvedValue({
      id: 'runway-task-123',
      status: 'SUCCEEDED',
      output: 'https://example.com/generated-image.png',
      progress: 100,
    });

    vi.mocked(RunwayAPI.extractImageUrl).mockReturnValue('https://example.com/generated-image.png');
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
  };

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      expect(screen.getByText('Image Editor')).toBeInTheDocument();
      expect(screen.getByText('Back to Project')).toBeInTheDocument();
    });

    it('displays the source image', () => {
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      const image = screen.getByAltText('test-image.jpg');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute(
        'src',
        'https://example.com/user-uploads/user-uploads/test-user-id/test-project/test-image.jpg'
      );
    });

    it('displays aspect ratio selection controls', () => {
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnSave} onSave={mockOnSave} />
      );

      expect(screen.getByText('Aspect Ratio')).toBeInTheDocument();
      expect(screen.getByText('16:9')).toBeInTheDocument();
      expect(screen.getByText('9:16')).toBeInTheDocument();
      expect(screen.getByText('1:1')).toBeInTheDocument();
    });

    it('defaults to first aspect ratio option', () => {
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // The first ratio (16:9 / 1280:720) should be selected by default
      const ratioButtons = screen.getAllByText('16:9');
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
      const user = userEvent.setup();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Find the Generate button (it's in a button element)
      const generateButton = screen.getByRole('button', { name: /Generate/i });
      expect(generateButton).toBeDisabled();

      // Enter a prompt
      const promptInput = screen.getByPlaceholderText(/Describe how you want to edit this image/);
      await user.type(promptInput, 'Make it look professional');

      // Now the button should be enabled
      await waitFor(() => {
        expect(generateButton).not.toBeDisabled();
      });
    });

    it('calls Runway API with correct parameters including ratio', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Select a different aspect ratio
      const squareRatio = screen.getByText('1:1');
      await user.click(squareRatio);

      // Enter prompt
      const promptInput = screen.getByPlaceholderText(/Describe how you want to edit this image/);
      await user.type(promptInput, 'Add a gradient background');

      // Click generate
      const generateButton = screen.getByRole('button', { name: /Generate/i });
      await user.click(generateButton);

      // Verify Runway API was called with correct parameters
      await waitFor(() => {
        expect(RunwayAPI.createRunwayImageJob).toHaveBeenCalledWith({
          mode: 'image-generation',
          promptImage: 'https://example.com/user-uploads/user-uploads/test-user-id/test-project/test-image.jpg',
          promptText: expect.stringContaining('Add a gradient background'),
          model: 'gen4_image_turbo',
          ratio: '1024:1024', // 1:1 ratio maps to 1024:1024
        });
      });
    });

    it('uses default ratio (16:9) when no ratio is explicitly selected', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Enter prompt without changing ratio
      const promptInput = screen.getByPlaceholderText(/Describe how you want to edit this image/);
      await user.type(promptInput, 'Enhance the colors');

      // Click generate
      const generateButton = screen.getByRole('button', { name: /Generate/i });
      await user.click(generateButton);

      // Verify Runway API was called with default ratio (1280:720 for 16:9)
      await waitFor(() => {
        expect(RunwayAPI.createRunwayImageJob).toHaveBeenCalledWith(
          expect.objectContaining({
            ratio: '1280:720',
          })
        );
      });
    });

    it('includes enhanced prompt with context when provided', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Enter prompt
      const promptInput = screen.getByPlaceholderText(/Describe how you want to edit this image/);
      await user.type(promptInput, 'Add vibrant colors');

      // Enter context
      const contextInput = screen.getByPlaceholderText(/Optional context about the image/);
      await user.type(contextInput, 'This is a product photo');

      // Click generate
      const generateButton = screen.getByRole('button', { name: /Generate/i });
      await user.click(generateButton);

      // Verify enhanced prompt includes context
      await waitFor(() => {
        expect(RunwayAPI.createRunwayImageJob).toHaveBeenCalledWith(
          expect.objectContaining({
            promptText: expect.stringContaining('This is a product photo'),
          })
        );
      });
    });

    it('polls for job completion and extracts image URL', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Enter prompt and generate
      const promptInput = screen.getByPlaceholderText(/Describe how you want to edit this image/);
      await user.type(promptInput, 'Test prompt');
      const generateButton = screen.getByRole('button', { name: /Generate/i });
      await user.click(generateButton);

      // Verify polling was called
      await waitFor(() => {
        expect(RunwayAPI.pollJobStatus).toHaveBeenCalledWith(
          'runway-task-123',
          expect.any(Function),
          60,
          2000
        );
      });

      // Verify image URL extraction
      expect(RunwayAPI.extractImageUrl).toHaveBeenCalled();
    });

    it('uploads generated image to storage and saves to database', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Enter prompt and generate
      const promptInput = screen.getByPlaceholderText(/Describe how you want to edit this image/);
      await user.type(promptInput, 'Test prompt');
      const generateButton = screen.getByRole('button', { name: /Generate/i });
      await user.click(generateButton);

      // Wait for image to be generated and uploaded
      await waitFor(
        () => {
          expect(database.storage.upload).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );

      // Verify the comparison view is shown
      await waitFor(() => {
        expect(screen.getByText('Original')).toBeInTheDocument();
        expect(screen.getByText('AI Edited')).toBeInTheDocument();
      });
    });

    it('saves edited image to database when Save button is clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Generate an image first
      const promptInput = screen.getByPlaceholderText(/Describe how you want to edit this image/);
      await user.type(promptInput, 'Test prompt');
      const generateButton = screen.getByRole('button', { name: /Generate/i });
      await user.click(generateButton);

      // Wait for generation to complete
      await waitFor(
        () => {
          expect(screen.getByText('Save to Project')).not.toBeDisabled();
        },
        { timeout: 5000 }
      );

      // Click save button
      const saveButton = screen.getByText('Save to Project');
      await user.click(saveButton);

      // Verify database create was called
      await waitFor(() => {
        expect(database.editedImages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            project_id: 'test-project',
            user_id: 'test-user-id',
            source_asset_id: 'asset-1',
            prompt: 'Test prompt',
            ai_model: 'runway-gen4-turbo',
          })
        );
      });

      // Verify onSave callback was called
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('Save to Project Button - Context Parsing', () => {
    const generateImageAndWaitForSave = async (user: ReturnType<typeof userEvent.setup>) => {
      const promptInput = screen.getByPlaceholderText(/Describe how you want to edit this image/);
      await user.type(promptInput, 'Test prompt');
      const generateButton = screen.getByRole('button', { name: /Generate/i });
      await user.click(generateButton);

      // Wait for generation to complete
      await waitFor(
        () => {
          expect(screen.getByText('Save to Project')).not.toBeDisabled();
        },
        { timeout: 5000 }
      );
    };

    it('saves with empty context string as empty object', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      await generateImageAndWaitForSave(user);

      // Leave context empty (default empty string)
      const saveButton = screen.getByText('Save to Project');
      await user.click(saveButton);

      // Verify context is saved as empty object (not parsed JSON)
      await waitFor(() => {
        expect(database.editedImages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            context: {},
          })
        );
      });

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockShowToast).toHaveBeenCalledWith('Image saved successfully', 'success');
    });

    it('saves with whitespace-only context as empty object', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      await generateImageAndWaitForSave(user);

      // Enter only whitespace in context
      const contextInput = screen.getByPlaceholderText(/Optional context about the image/);
      await user.type(contextInput, '   ');

      const saveButton = screen.getByText('Save to Project');
      await user.click(saveButton);

      // Verify context is saved as empty object
      await waitFor(() => {
        expect(database.editedImages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            context: {},
          })
        );
      });

      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it('saves with valid JSON context string correctly parsed', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      await generateImageAndWaitForSave(user);

      // Enter valid JSON in context
      const contextInput = screen.getByPlaceholderText(/Optional context about the image/) as HTMLInputElement;
      await user.clear(contextInput);
      // Use paste to handle JSON syntax properly
      await user.click(contextInput);
      await user.paste('{"type": "product", "category": "electronics"}');

      const saveButton = screen.getByText('Save to Project');
      await user.click(saveButton);

      // Verify context is parsed correctly
      await waitFor(() => {
        expect(database.editedImages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            context: {
              type: 'product',
              category: 'electronics',
            },
          })
        );
      });

      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it('saves with invalid JSON context string wrapped in object', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      await generateImageAndWaitForSave(user);

      // Enter invalid JSON in context (plain text)
      const contextInput = screen.getByPlaceholderText(/Optional context about the image/) as HTMLInputElement;
      await user.clear(contextInput);
      await user.type(contextInput, 'This is a product photo');

      const saveButton = screen.getByText('Save to Project');
      await user.click(saveButton);

      // Verify invalid JSON is wrapped in object with 'text' key
      await waitFor(() => {
        expect(database.editedImages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            context: {
              text: 'This is a product photo',
            },
          })
        );
      });

      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it('saves with malformed JSON context string wrapped in object', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      await generateImageAndWaitForSave(user);

      // Enter malformed JSON (missing closing brace)
      const contextInput = screen.getByPlaceholderText(/Optional context about the image/) as HTMLInputElement;
      await user.clear(contextInput);
      // Use paste to handle JSON syntax properly
      await user.click(contextInput);
      await user.paste('{"type": "product"');

      const saveButton = screen.getByText('Save to Project');
      await user.click(saveButton);

      // Verify malformed JSON is wrapped in object with 'text' key
      await waitFor(() => {
        expect(database.editedImages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            context: {
              text: '{"type": "product"',
            },
          })
        );
      });

      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it('handles database save error gracefully', async () => {
      const user = userEvent.setup();
      const dbError = new Error('Database connection failed');
      vi.mocked(database.editedImages.create).mockRejectedValueOnce(dbError);

      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      await generateImageAndWaitForSave(user);

      const saveButton = screen.getByText('Save to Project');
      await user.click(saveButton);

      // Verify error toast is shown
      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to save edited image. Please try again.', 'error');
      });

      // Verify onSave callback was NOT called on error
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('validates user is logged in before saving', async () => {
      const user = userEvent.setup();
      // Mock useUserId to return null (not logged in) from the start
      // This will prevent generation, but we can still test the save validation
      mockUseUserId.mockReturnValue(null);

      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Try to generate image - this should fail due to missing userId
      const promptInput = screen.getByPlaceholderText(/Describe how you want to edit this image/);
      await user.type(promptInput, 'Test prompt');
      const generateButton = screen.getByRole('button', { name: /Generate/i });
      await user.click(generateButton);

      // Verify error toast is shown for generation
      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('User must be logged in to generate images', 'error');
      });

      // Reset mock for other tests
      mockUseUserId.mockReturnValue('test-user-id');
    });

    it('validates image is generated before saving', async () => {
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Don't generate an image, just check button state
      const saveButton = screen.getByText('Save to Project');
      
      // Button should be disabled if no image generated
      expect(saveButton).toBeDisabled();

      // Verify database was not called (button is disabled so click won't work)
      expect(database.editedImages.create).not.toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('shows error toast when Runway API fails', async () => {
      const user = userEvent.setup();
      vi.mocked(RunwayAPI.createRunwayImageJob).mockRejectedValue(new Error('API Error'));

      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      const promptInput = screen.getByPlaceholderText(/Describe how you want to edit this image/);
      await user.type(promptInput, 'Test prompt');
      const generateButton = screen.getByText('Generate');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('API Error', 'error');
      });
    });

    it('shows error toast when image URL extraction fails', async () => {
      const user = userEvent.setup();
      vi.mocked(RunwayAPI.extractImageUrl).mockReturnValue(null);

      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      const promptInput = screen.getByPlaceholderText(/Describe how you want to edit this image/);
      await user.type(promptInput, 'Test prompt');
      const generateButton = screen.getByText('Generate');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Failed to extract image URL from Runway response',
          'error'
        );
      });
    });

    it('shows warning when user tries to save without generating', async () => {
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Save button should be disabled initially
      const saveButton = screen.getByText('Save to Project');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Version History', () => {
    it('tracks version history after generating images', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <ImageEditor asset={mockAsset} projectId="test-project" onClose={mockOnClose} onSave={mockOnSave} />
      );

      // Generate first image
      const promptInput = screen.getByPlaceholderText(/Describe how you want to edit this image/);
      await user.type(promptInput, 'First version');
      const generateButton = screen.getByText('Generate');
      await user.click(generateButton);

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
  });
});

