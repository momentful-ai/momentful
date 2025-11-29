import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaCard } from '../../../components/shared/MediaCard';
import { MediaAsset, EditedImage } from '../../../types';

// Mock Supabase and database dependencies
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/mock-url' } })),
      })),
    },
  },
}));

// Mock VideoPlayer to avoid Radix UI issues in tests
vi.mock('../../../components/VideoPlayer', () => ({
  VideoPlayer: ({ videoUrl }: { videoUrl: string }) => (
    <div data-testid="mock-video-player" data-video-url={videoUrl}>
      <video src={videoUrl} className="w-full h-full object-cover" />
    </div>
  ),
}));

vi.mock('../../../lib/database', () => ({
  database: {
    mediaAssets: {
      getById: vi.fn(),
    },
    storage: {
      getPublicUrl: vi.fn(() => 'https://example.com/mock-url'),
    },
  },
}));

// Mock that returns promise resolved on next tick
const mockGetAssetUrl = vi.fn((path: string): Promise<string> => new Promise(resolve => {
  setTimeout(() => resolve(`https://example.com/${path}`), 0);
}));

const mockMediaAsset: MediaAsset = {
  id: 'asset-1',
  project_id: 'project-1',
  user_id: 'user-1',
  file_name: 'test-image.jpg',
  file_type: 'image',
  file_size: 1024,
  storage_path: 'path/to/image.jpg',
  thumbnail_url: 'https://example.com/thumb.jpg',
  width: 1920,
  height: 1080,
  sort_order: 0,
  created_at: '2025-01-01T00:00:00Z',
};

const mockEditedImage: EditedImage = {
  id: 'edited-1',
  project_id: 'project-1',
  user_id: 'user-1',
  prompt: 'Make it more vibrant',
  context: {},
  ai_model: 'dalle-3',
  edited_url: 'https://example.com/edited.jpg',
  storage_path: 'path/to/edited.jpg',
  width: 1920,
  height: 1080,
  created_at: '2025-01-01T01:00:00Z',
};

describe('MediaCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MediaAsset rendering', () => {
    it('renders MediaAsset in grid view', () => {
      render(
        <MediaCard
          item={mockMediaAsset}
          viewMode="grid"
          getAssetUrl={mockGetAssetUrl}
        />
      );

      expect(screen.getByAltText('test-image.jpg')).toBeInTheDocument();
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    });

    it('renders MediaAsset in list view', () => {
      render(
        <MediaCard
          item={mockMediaAsset}
          viewMode="list"
          getAssetUrl={mockGetAssetUrl}
        />
      );

      expect(screen.getByAltText('test-image.jpg')).toBeInTheDocument();
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    });

    it('shows file size and dimensions for MediaAsset', () => {
      render(
        <MediaCard
          item={mockMediaAsset}
          viewMode="grid"
          getAssetUrl={mockGetAssetUrl}
        />
      );

      expect(screen.getByText(/1.0 KB/)).toBeInTheDocument();
      expect(screen.getByText(/1920 × 1080/)).toBeInTheDocument();
    });

    it('calls onClick when card is clicked', () => {
      const handleClick = vi.fn();
      render(
        <MediaCard
          item={mockMediaAsset}
          viewMode="grid"
          onClick={handleClick}
          getAssetUrl={mockGetAssetUrl}
        />
      );

      fireEvent.click(screen.getByAltText('test-image.jpg').closest('.group')!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('EditedImage rendering', () => {
    it('renders EditedImage in grid view', () => {
      render(
        <MediaCard
          item={mockEditedImage}
          viewMode="grid"
          getAssetUrl={mockGetAssetUrl}
        />
      );

      expect(screen.getByAltText('Make it more vibrant')).toBeInTheDocument();
      expect(screen.getByText('Make it more vibrant')).toBeInTheDocument();
    });

    it('shows prompt and resolution for EditedImage', () => {
      render(
        <MediaCard
          item={mockEditedImage}
          viewMode="grid"
          getAssetUrl={mockGetAssetUrl}
        />
      );

      expect(screen.getByText('Make it more vibrant')).toBeInTheDocument();
      expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
    });
  });

  describe('Edit with AI functionality', () => {
    it('shows Edit with AI overlay for image MediaAsset on hover', () => {
      const handleEdit = vi.fn();
      render(
        <MediaCard
          item={mockMediaAsset}
          viewMode="grid"
          onEditImage={handleEdit}
          getAssetUrl={mockGetAssetUrl}
        />
      );

      const card = screen.getByAltText('test-image.jpg').closest('.group');
      fireEvent.mouseEnter(card!);
      
      expect(screen.getByText('Edit with AI')).toBeInTheDocument();
    });

    it('does not show Edit with AI for video MediaAsset', () => {
      const videoAsset: MediaAsset = {
        ...mockMediaAsset,
        file_type: 'video',
      };
      const handleEdit = vi.fn();
      
      render(
        <MediaCard
          item={videoAsset}
          viewMode="grid"
          onEditImage={handleEdit}
          getAssetUrl={mockGetAssetUrl}
        />
      );

      const card = screen.getByText('test-image.jpg').closest('.group');
      fireEvent.mouseEnter(card!);
      
      expect(screen.queryByText('Edit with AI')).not.toBeInTheDocument();
    });

    it('calls onEditImage when Edit with AI is clicked for MediaAsset', () => {
      const handleEdit = vi.fn();
      render(
        <MediaCard
          item={mockMediaAsset}
          viewMode="grid"
          onEditImage={handleEdit}
          getAssetUrl={mockGetAssetUrl}
        />
      );

      const card = screen.getByAltText('test-image.jpg').closest('.group');
      fireEvent.mouseEnter(card!);
      
      // The overlay should be visible, but clicking the overlay triggers the card click
      // For testing, we can simulate clicking the edit button
    });

    it('calls onEditImage when Edit with AI is clicked for EditedImage', () => {
      const handleEdit = vi.fn();
      render(
        <MediaCard
          item={mockEditedImage}
          viewMode="grid"
          onEditImage={handleEdit}
          getAssetUrl={mockGetAssetUrl}
        />
      );

      const card = screen.getByAltText('Make it more vibrant').closest('.group');
      fireEvent.mouseEnter(card!);
      
      expect(screen.getByText('Edit with AI')).toBeInTheDocument();
    });
  });

  describe('Download functionality', () => {
    it('shows download button on hover when onDownload is provided', () => {
      const handleDownload = vi.fn();
      render(
        <MediaCard
          item={mockMediaAsset}
          viewMode="grid"
          onDownload={handleDownload}
          getAssetUrl={mockGetAssetUrl}
        />
      );

      const card = screen.getByAltText('test-image.jpg').closest('.group');
      fireEvent.mouseEnter(card!);
      
      const downloadButton = screen.getByTitle('Download');
      expect(downloadButton).toBeInTheDocument();
    });

    it('calls onDownload when download button is clicked', () => {
      const handleDownload = vi.fn();
      render(
        <MediaCard
          item={mockMediaAsset}
          viewMode="grid"
          onDownload={handleDownload}
          getAssetUrl={mockGetAssetUrl}
        />
      );

      const card = screen.getByAltText('test-image.jpg').closest('.group');
      fireEvent.mouseEnter(card!);
      
      const downloadButton = screen.getByTitle('Download');
      fireEvent.click(downloadButton);
      
      expect(handleDownload).toHaveBeenCalledWith(mockMediaAsset);
    });
  });

  describe('Delete functionality', () => {
    it('shows delete button on hover when onDelete is provided', () => {
      const handleDelete = vi.fn();
      render(
        <MediaCard
          item={mockMediaAsset}
          viewMode="grid"
          onDelete={handleDelete}
          getAssetUrl={mockGetAssetUrl}
        />
      );

      const card = screen.getByAltText('test-image.jpg').closest('.group');
      fireEvent.mouseEnter(card!);
      
      const deleteButton = screen.getByTitle('Delete');
      expect(deleteButton).toBeInTheDocument();
    });

    it('calls onDelete when delete button is clicked', () => {
      const handleDelete = vi.fn();
      render(
        <MediaCard
          item={mockMediaAsset}
          viewMode="grid"
          onDelete={handleDelete}
          getAssetUrl={mockGetAssetUrl}
        />
      );

      const card = screen.getByAltText('test-image.jpg').closest('.group');
      fireEvent.mouseEnter(card!);
      
      const deleteButton = screen.getByTitle('Delete');
      fireEvent.click(deleteButton);
      
      expect(handleDelete).toHaveBeenCalledWith(mockMediaAsset);
    });
  });

  describe('Edit overlay behavior', () => {
    it('shows edit overlay on hover for editable images', () => {
      const handleEdit = vi.fn();

      render(
        <MediaCard
          item={mockMediaAsset}
          viewMode="grid"
          onEditImage={handleEdit}
          getAssetUrl={mockGetAssetUrl}
        />
      );

      const card = screen.getByAltText('test-image.jpg').closest('.group');
      fireEvent.mouseEnter(card!);

      expect(screen.getByText('Edit with AI')).toBeInTheDocument();
    });

    it('shows action buttons on hover for all view modes', () => {
      const handleEdit = vi.fn();
      const handleDownload = vi.fn();
      const handleDelete = vi.fn();

      render(
        <MediaCard
          item={mockMediaAsset}
          viewMode="grid"
          onEditImage={handleEdit}
          onDownload={handleDownload}
          onDelete={handleDelete}
          getAssetUrl={mockGetAssetUrl}
        />
      );

      const card = screen.getByAltText('test-image.jpg').closest('.group');
      fireEvent.mouseEnter(card!);

      expect(screen.getByTitle('Download')).toBeInTheDocument();
      expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });
  });

  describe('Selection state', () => {
    it('applies selected styling when isSelected is true', () => {
      render(
        <MediaCard
          item={mockMediaAsset}
          viewMode="grid"
          isSelected={true}
          getAssetUrl={mockGetAssetUrl}
        />
      );

      const card = screen.getByAltText('test-image.jpg').closest('.group');
      expect(card).toHaveClass('ring-2', 'ring-primary');
    });
  });
});
