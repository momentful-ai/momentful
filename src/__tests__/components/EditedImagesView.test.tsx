import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UseQueryResult } from '@tanstack/react-query';
import { EditedImagesView } from '../../components/ProjectWorkspace/EditedImagesView';
import { EditedImage } from '../../types';
import { useEditedImages } from '../../hooks/useEditedImages';

// Mock the useEditedImages hook
vi.mock('../../hooks/useEditedImages', () => ({
  useEditedImages: vi.fn(),
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
      parent_id: null,
      created_at: '2025-10-20T15:59:30.165+00:00',
    },
  ];

  const defaultProps = {
    projectId: 'project-1',
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
    } as UseEditedImagesResult);

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

    // In list view, the layout should be different (space-y-2 instead of grid)
    const container = screen.getByText('Test prompt').closest('[class*="space-y-2"]');
    expect(container).toBeInTheDocument();
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

    const exportButton = screen.getByTitle('Export image');
    const publishButton = screen.getByTitle('Publish to social');

    expect(exportButton).toBeInTheDocument();
    expect(publishButton).toBeInTheDocument();
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

    const exportButton = screen.getByTitle('Export image');
    exportButton.click();

    expect(onExport).toHaveBeenCalledWith(mockEditedImages[0]);
  });

  it('calls onPublish when publish button is clicked', () => {
    mockUseEditedImages.mockReturnValue({
      data: mockEditedImages,
      isLoading: false,
      isError: false,
      error: null,
    } as UseEditedImagesResult);

    const onPublish = vi.fn();
    renderWithQueryClient(<EditedImagesView {...defaultProps} onPublish={onPublish} />);

    const publishButton = screen.getByTitle('Publish to social');
    publishButton.click();

    expect(onPublish).toHaveBeenCalledWith(mockEditedImages[0]);
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
});

