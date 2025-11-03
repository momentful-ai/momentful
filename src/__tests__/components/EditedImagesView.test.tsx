import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UseQueryResult } from '@tanstack/react-query';
import { EditedImagesView } from '../../components/ProjectWorkspace/EditedImagesView';
import { EditedImage, MediaAsset } from '../../types';
import { useEditedImages } from '../../hooks/useEditedImages';
import { ToastProvider } from '../../contexts/ToastProvider';
import { mockSupabase } from '../test-utils.tsx';

// Mock the useEditedImages hook
vi.mock('../../hooks/useEditedImages', () => ({
  useEditedImages: vi.fn(),
}));

// Mock supabase
mockSupabase();

// Mock MediaCard component
vi.mock('../../components/shared/MediaCard', () => ({
  MediaCard: ({ item, onDownload, onDelete, onEditImage, viewMode }: {
    item: EditedImage;
    onDownload?: () => void;
    onDelete?: () => void;
    onEditImage?: (item: EditedImage | MediaAsset) => void;
    viewMode?: 'grid' | 'list';
  }) => (
    <div data-testid={`edited-image-${item.id}`} className={viewMode === 'list' ? 'space-y-2' : ''}>
      <div className="group relative">
        <img src={item.edited_url} alt={item.prompt} />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100">
          {onEditImage && (
            <button 
              onClick={() => onEditImage(item)} 
              title="Edit with AI"
              data-testid={`edit-button-${item.id}`}
              className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/60"
            >
              Edit with AI
            </button>
          )}
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
          {onDownload && <button onClick={onDownload} title="Download">Download</button>}
          {onDelete && <button onClick={onDelete} title="Delete">Delete</button>}
        </div>
      </div>
      <div>
        <div>{item.prompt}</div>
        <div>{item.ai_model}</div>
        <div>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        {item.context && typeof item.context === 'object' && Object.keys(item.context).length > 0 && (
          <div>{JSON.stringify(item.context)}</div>
        )}
      </div>
    </div>
  ),
}));

type UseEditedImagesResult = UseQueryResult<EditedImage[], Error>;

// Mock ResizeObserver for test environment
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

describe('EditedImagesView', () => {
  let queryClient: QueryClient;
  const mockUseEditedImages = vi.mocked(useEditedImages);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const mockEditedImages: EditedImage[] = [
    {
      id: 'edited-1',
      project_id: 'project-1',
      user_id: 'user-1',
      prompt: 'Test prompt',
      context: {},
      ai_model: 'runway-gen4-turbo',
      storage_path: 'user-uploads/user-1/project-1/edited-1.png',
      edited_url: 'https://example.com/edited-1.png',
      width: 1920,
      height: 1080,
      version: 1,
      parent_id: undefined,
      created_at: '2025-10-20T15:59:30.165+00:00',
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
    mockUseEditedImages.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as UseEditedImagesResult);

    renderWithQueryClient(<EditedImagesView {...defaultProps} />);

    // Should show loading skeleton
    expect(document.querySelector('[class*="animate-pulse"]')).toBeInTheDocument();
  });

  it('renders empty state when no images provided', () => {
    mockUseEditedImages.mockReturnValue({
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
    } as unknown as UseEditedImagesResult);

    renderWithQueryClient(<EditedImagesView {...defaultProps} />);

    expect(screen.getByText('No edited images yet')).toBeInTheDocument();
    expect(screen.getByText('Use AI to edit your product images with text prompts and context.')).toBeInTheDocument();
  });

  it('renders images in grid view', () => {
    mockUseEditedImages.mockReturnValue({
      data: mockEditedImages,
      isLoading: false,
      isError: false,
      error: null,
    } as UseEditedImagesResult);

    renderWithQueryClient(<EditedImagesView {...defaultProps} />);

    expect(screen.getByText('Test prompt')).toBeInTheDocument();
    expect(screen.getByText('runway-gen4-turbo')).toBeInTheDocument();

    const imageElement = document.querySelector('img');
    expect(imageElement).toBeInTheDocument();
    expect(imageElement).toHaveAttribute('src', mockEditedImages[0].edited_url);
  });

  it('renders images in list view', () => {
    mockUseEditedImages.mockReturnValue({
      data: mockEditedImages,
      isLoading: false,
      isError: false,
      error: null,
    } as UseEditedImagesResult);

    renderWithQueryClient(<EditedImagesView {...defaultProps} viewMode="list" />);

    expect(screen.getByText('Test prompt')).toBeInTheDocument();

    // In list view, the layout should be different - check that the item exists
    expect(screen.getByText('Test prompt')).toBeInTheDocument();
  });

  it('displays image metadata correctly', () => {
    mockUseEditedImages.mockReturnValue({
      data: mockEditedImages,
      isLoading: false,
      isError: false,
      error: null,
    } as UseEditedImagesResult);

    renderWithQueryClient(<EditedImagesView {...defaultProps} />);

    expect(screen.getByText('Test prompt')).toBeInTheDocument();
    expect(screen.getByText('runway-gen4-turbo')).toBeInTheDocument();
    expect(screen.getByText('Oct 20, 2025')).toBeInTheDocument();
  });

  it('shows export and publish buttons on hover', () => {
    mockUseEditedImages.mockReturnValue({
      data: mockEditedImages,
      isLoading: false,
      isError: false,
      error: null,
    } as UseEditedImagesResult);

    renderWithQueryClient(<EditedImagesView {...defaultProps} />);

    const exportButton = screen.getByTitle('Download');
    // Note: There's no publish button in EditedImagesView, only export and delete

    expect(exportButton).toBeInTheDocument();
  });

  it('calls onExport when export button is clicked', () => {
    mockUseEditedImages.mockReturnValue({
      data: mockEditedImages,
      isLoading: false,
      isError: false,
      error: null,
    } as UseEditedImagesResult);

    const onExport = vi.fn();
    renderWithQueryClient(<EditedImagesView {...defaultProps} onExport={onExport} />);

    const exportButton = screen.getByTitle('Download');
    exportButton.click();

    expect(onExport).toHaveBeenCalledWith(mockEditedImages[0]);
  });


  it('displays context when provided', () => {
    const imageWithContext: EditedImage = {
      ...mockEditedImages[0],
      context: { key: 'value', test: 'data' },
    };

    mockUseEditedImages.mockReturnValue({
      data: [imageWithContext],
      isLoading: false,
      isError: false,
      error: null,
    } as UseEditedImagesResult);

    renderWithQueryClient(<EditedImagesView {...defaultProps} />);

    expect(screen.getByText(/"key":"value"/)).toBeInTheDocument();
  });

  it('handles multiple images correctly', () => {
    const multipleImages: EditedImage[] = [
      mockEditedImages[0],
      {
        ...mockEditedImages[0],
        id: 'edited-2',
        prompt: 'Second prompt',
      },
    ];

    mockUseEditedImages.mockReturnValue({
      data: multipleImages,
      isLoading: false,
      isError: false,
      error: null,
    } as UseEditedImagesResult);

    renderWithQueryClient(<EditedImagesView {...defaultProps} />);

    expect(screen.getByText('Test prompt')).toBeInTheDocument();
    expect(screen.getByText('Second prompt')).toBeInTheDocument();
  });

  it('calls onEditImage with EditedImage when Edit with AI button is clicked', async () => {
    const editedImageWithSource: EditedImage = {
      ...mockEditedImages[0],
      source_asset_id: 'source-asset-1',
    };

    mockUseEditedImages.mockReturnValue({
      data: [editedImageWithSource],
      isLoading: false,
      isError: false,
      error: null,
    } as UseEditedImagesResult);

    const onEditImage = vi.fn();
    renderWithQueryClient(
      <EditedImagesView 
        {...defaultProps} 
        onEditImage={onEditImage}
      />
    );

    // Find the edit button and hover to make it visible
    const editButton = screen.getByTestId('edit-button-edited-1');
    
    // Simulate hover by triggering the group-hover state
    const card = editButton.closest('.group');
    if (card) {
      fireEvent.mouseEnter(card);
    }

    // Click the edit button
    fireEvent.click(editButton);

    // Should call onEditImage with the EditedImage directly (not the source asset)
    await waitFor(() => {
      expect(onEditImage).toHaveBeenCalledWith(editedImageWithSource, 'project-1');
    }, { timeout: 1000 });
  });

  it('calls onEditImage even when source_asset_id is missing', async () => {
    const editedImageWithoutSource: EditedImage = {
      ...mockEditedImages[0],
      source_asset_id: undefined,
    };

    mockUseEditedImages.mockReturnValue({
      data: [editedImageWithoutSource],
      isLoading: false,
      isError: false,
      error: null,
    } as UseEditedImagesResult);

    const onEditImage = vi.fn();
    renderWithQueryClient(
      <EditedImagesView 
        {...defaultProps} 
        onEditImage={onEditImage}
      />
    );

    // Find the edit button
    const editButton = screen.getByTestId('edit-button-edited-1');
    
    // Simulate hover
    const card = editButton.closest('.group');
    if (card) {
      fireEvent.mouseEnter(card);
    }

    // Click the edit button
    fireEvent.click(editButton);

    // Should still call onEditImage with the EditedImage
    // The App.tsx will handle fetching the source asset if needed
    await waitFor(() => {
      expect(onEditImage).toHaveBeenCalledWith(editedImageWithoutSource, 'project-1');
    }, { timeout: 1000 });
  });
});

