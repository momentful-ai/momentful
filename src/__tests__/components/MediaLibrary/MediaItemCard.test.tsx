import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MediaItemCard } from '../../../components/MediaLibrary/MediaItemCard';
import { MediaAsset } from '../../../types';

// Mock VideoPlayer to avoid Radix UI issues in tests
vi.mock('../../../components/VideoPlayer', () => ({
  VideoPlayer: ({ videoUrl }: { videoUrl: string }) => (
    <div data-testid="mock-video-player" data-video-url={videoUrl}>
      <video src={videoUrl} className="w-full h-full object-cover" />
    </div>
  ),
}));

// Mock the utility functions
vi.mock('../../../lib/utils', () => ({
  mergeName: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
  formatFileSize: vi.fn((bytes: number) => `${bytes} B`),
  formatDuration: vi.fn((seconds: number) => `${seconds}s`),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Trash2: () => <div data-testid="trash-icon">🗑️</div>,
  Film: () => <div data-testid="film-icon">🎥</div>,
  Clock: () => <div data-testid="clock-icon">🕒</div>,
  Wand2: () => <div data-testid="wand-icon">✨</div>,
  Download: () => <div data-testid="download-icon">⬇️</div>,
}));

describe('MediaItemCard', () => {
  const mockAsset: MediaAsset = {
    id: 'test-id',
    file_name: 'test-image.jpg',
    file_type: 'image',
    file_size: 1024,
    storage_path: 'test/path.jpg',
    width: 1920,
    height: 1080,
    project_id: 'project-123',
    user_id: 'user-123',
    sort_order: 0,
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockVideoAsset: MediaAsset = {
    ...mockAsset,
    file_name: 'test-video.mp4',
    file_type: 'video',
    duration: 30,
  };

  const defaultProps = {
    asset: mockAsset,
    isSelected: false,
    viewMode: 'grid' as const,
    onClick: vi.fn(),
    onEditImage: undefined,
    onRequestDelete: vi.fn(),
    onDownload: vi.fn(),
    getAssetUrl: vi.fn((path: string) => `https://example.com/${path}`),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders image asset in grid view', () => {
      render(<MediaItemCard {...defaultProps} />);

      expect(screen.getByAltText('test-image.jpg')).toBeInTheDocument();
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
      expect(screen.getByText('1024 B')).toBeInTheDocument();
      expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
    });

    it('renders video asset with VideoPlayer', () => {
      render(<MediaItemCard {...defaultProps} asset={mockVideoAsset} />);

      expect(screen.getByTestId('mock-video-player')).toBeInTheDocument();
      expect(screen.getByText('30s')).toBeInTheDocument();
    });

    it('renders in list view with different layout', () => {
      render(<MediaItemCard {...defaultProps} viewMode="list" />);

      // The Card component should have flex-row layout in list mode
      const card = screen.getByText('test-image.jpg').closest('[class*="group"]');
      expect(card).toHaveClass('flex flex-row');
    });
  });

  describe('Selection State', () => {
    it('applies selection styling when selected', () => {
      render(<MediaItemCard {...defaultProps} isSelected={true} />);

      const card = screen.getByText('test-image.jpg').closest('[class*="group"]');
      expect(card).toHaveClass('ring-2 ring-primary');
    });

    it('does not apply selection styling when not selected', () => {
      render(<MediaItemCard {...defaultProps} isSelected={false} />);

      const card = screen.getByText('test-image.jpg').closest('[class*="group"]');
      expect(card).not.toHaveClass('ring-2 ring-primary');
    });
  });

  describe('Image Editing', () => {
    it('shows edit overlay on hover for images with edit handler', async () => {
      const mockOnEditImage = vi.fn();
      render(
        <MediaItemCard
          {...defaultProps}
          onEditImage={mockOnEditImage}
        />
      );

      const card = screen.getByText('test-image.jpg').closest('div');

      // Hover over the card
      fireEvent.mouseEnter(card!);

      await waitFor(() => {
        expect(screen.getByText('Edit with AI')).toBeInTheDocument();
        expect(screen.getByTestId('wand-icon')).toBeInTheDocument();
      });
    });

    it('does not show edit overlay for videos', () => {
      const mockOnEditImage = vi.fn();
      render(
        <MediaItemCard
          {...defaultProps}
          asset={mockVideoAsset}
          onEditImage={mockOnEditImage}
        />
      );

      const card = screen.getByText('test-video.mp4').closest('div');
      fireEvent.mouseEnter(card!);

      expect(screen.queryByText('Edit with AI')).not.toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('shows action buttons on hover', async () => {
      render(<MediaItemCard {...defaultProps} />);

      const card = screen.getByText('test-image.jpg').closest('div');
      fireEvent.mouseEnter(card!);

      await waitFor(() => {
        expect(screen.getByTestId('download-icon')).toBeInTheDocument();
        expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
      });
    });

    it('calls onDownload when download button is clicked', async () => {
      render(<MediaItemCard {...defaultProps} />);

      const card = screen.getByText('test-image.jpg').closest('[class*="group"]');
      fireEvent.mouseEnter(card!);

      await waitFor(() => {
        const downloadButton = screen.getByTestId('download-icon').closest('button');
        fireEvent.click(downloadButton!);
      });

      expect(defaultProps.onDownload).toHaveBeenCalledWith(mockAsset);
      expect(defaultProps.onClick).not.toHaveBeenCalled();
    });

    it('calls onRequestDelete when delete button is clicked', async () => {
      render(<MediaItemCard {...defaultProps} />);

      const card = screen.getByText('test-image.jpg').closest('[class*="group"]');
      fireEvent.mouseEnter(card!);

      await waitFor(() => {
        const deleteButton = screen.getByTestId('trash-icon').closest('button');
        fireEvent.click(deleteButton!);
      });

      expect(defaultProps.onRequestDelete).toHaveBeenCalled();
      expect(defaultProps.onClick).not.toHaveBeenCalled();
    });

    it('only shows download button when onDownload is provided', async () => {
      render(<MediaItemCard {...defaultProps} onDownload={undefined} />);

      const card = screen.getByText('test-image.jpg').closest('div');
      fireEvent.mouseEnter(card!);

      await waitFor(() => {
        expect(screen.queryByTestId('download-icon')).not.toBeInTheDocument();
        expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Click Handling', () => {
    it('calls onClick when card is clicked', () => {
      render(<MediaItemCard {...defaultProps} />);

      const card = screen.getByText('test-image.jpg').closest('div');
      fireEvent.click(card!);

      expect(defaultProps.onClick).toHaveBeenCalled();
    });

    it('prevents event propagation when action buttons are clicked', async () => {
      render(<MediaItemCard {...defaultProps} />);

      const card = screen.getByText('test-image.jpg').closest('div');
      fireEvent.mouseEnter(card!);

      await waitFor(() => {
        const deleteButton = screen.getByTestId('trash-icon').closest('button');
        fireEvent.click(deleteButton!);
      });

      expect(defaultProps.onClick).not.toHaveBeenCalled();
    });
  });

  describe('File Metadata Display', () => {
    it('displays file size with formatting', () => {
      render(<MediaItemCard {...defaultProps} />);

      expect(screen.getByText('1024 B')).toBeInTheDocument();
    });

    it('displays dimensions for images', () => {
      render(<MediaItemCard {...defaultProps} />);

      expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
    });

    it('displays duration for videos in grid view', () => {
      render(<MediaItemCard {...defaultProps} asset={mockVideoAsset} />);

      expect(screen.getByText('30s')).toBeInTheDocument();
    });

    it('displays duration badge for videos in list view', () => {
      render(<MediaItemCard {...defaultProps} asset={mockVideoAsset} viewMode="list" />);

      // There should be two elements with "30s" - one in the video overlay and one in the list badge
      const durationBadges = screen.getAllByText('30s');
      expect(durationBadges.length).toBeGreaterThan(1);
    });

    it('truncates long filenames', () => {
      const longNameAsset = { ...mockAsset, file_name: 'very-long-filename-that-should-be-truncated.jpg' };
      render(<MediaItemCard {...defaultProps} asset={longNameAsset} />);

      const filenameElement = screen.getByText('very-long-filename-that-should-be-truncated.jpg');
      expect(filenameElement).toHaveClass('truncate');
    });
  });

  describe('Animation', () => {
    it('applies random animation delay', () => {
      // Mock Math.random to return a predictable value
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.5);

      render(<MediaItemCard {...defaultProps} />);

      const card = screen.getByText('test-image.jpg').closest('[class*="group"]') as HTMLElement;
      expect(card).not.toBeNull();
      expect(card.style.animationDelay).toBe('50ms');

      mockRandom.mockRestore();
    });
  });
});
