import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaGrid } from '../../../components/shared/MediaGrid';

const mockImageItems = [
  {
    id: 'item-1',
    name: 'Image 1',
    thumbnail: 'https://example.com/thumb1.jpg',
    prompt: 'Beautiful sunset landscape',
    edited_url: 'https://example.com/edited1.jpg',
  },
  {
    id: 'item-2',
    name: 'Image 2',
    thumbnail: 'https://example.com/thumb2.jpg',
    prompt: 'Urban cityscape at night',
    edited_url: 'https://example.com/edited2.jpg',
  },
];

const mockSourceItems = [
  {
    id: 'source-1',
    name: 'Source Video 1',
    thumbnail: 'https://example.com/source1.jpg',
  },
  {
    id: 'source-2',
    name: 'Source Video 2',
    thumbnail: 'https://example.com/source2.jpg',
  },
];

describe('MediaGrid', () => {
  const mockOnSelectItem = vi.fn();
  const mockOnRemoveItem = vi.fn();
  const mockOnEditItem = vi.fn();
  const mockOnNavigateToVideo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders with default props', () => {
      render(
        <MediaGrid
          title="Test Grid"
          items={mockImageItems}
          onSelectItem={mockOnSelectItem}
        />
      );

      expect(screen.getByText('Test Grid')).toBeInTheDocument();
      expect(screen.getAllByRole('img')).toHaveLength(2);
    });

    it('renders with custom title', () => {
      render(
        <MediaGrid
          title="Custom Title"
          items={mockImageItems}
          onSelectItem={mockOnSelectItem}
        />
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('applies bg-card class to container', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          onSelectItem={mockOnSelectItem}
        />
      );

      const container = screen.getByText('Test').closest('div');
      expect(container).toHaveClass('bg-card');
    });
  });

  describe('loading state', () => {
    it('renders loading spinner when isLoading is true', () => {
      render(
        <MediaGrid
          title="Test"
          items={[]}
          isLoading={true}
          onSelectItem={mockOnSelectItem}
        />
      );

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('does not render items when loading', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          isLoading={true}
          onSelectItem={mockOnSelectItem}
        />
      );

      expect(screen.queryByText('Test (2)')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders default empty message', () => {
      render(
        <MediaGrid
          title="Test"
          items={[]}
          isLoading={false}
          onSelectItem={mockOnSelectItem}
        />
      );

      expect(screen.getByText('No items yet')).toBeInTheDocument();
    });

    it('renders custom empty message', () => {
      const customMessage = {
        title: 'Custom empty title',
        subtitle: 'Custom empty subtitle',
      };

      render(
        <MediaGrid
          title="Test"
          items={[]}
          isLoading={false}
          emptyMessage={customMessage}
          onSelectItem={mockOnSelectItem}
        />
      );

      expect(screen.getByText('Custom empty title')).toBeInTheDocument();
      expect(screen.getByText('Custom empty subtitle')).toBeInTheDocument();
    });
  });

  describe('grid configurations', () => {
    it('renders 2-column grid by default', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          gridCols={{ default: 2 }}
          onSelectItem={mockOnSelectItem}
        />
      );

      const grid = document.querySelector('.grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('renders 4-column grid', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          gridCols={{ default: 4 }}
          onSelectItem={mockOnSelectItem}
        />
      );

      const grid = document.querySelector('.grid-cols-4');
      expect(grid).toBeInTheDocument();
    });

    it('renders 6-column grid', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          gridCols={{ default: 6 }}
          onSelectItem={mockOnSelectItem}
        />
      );

      const grid = document.querySelector('.grid-cols-6');
      expect(grid).toBeInTheDocument();
    });

    it('renders responsive grid with md breakpoint', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          gridCols={{ default: 2, md: 4 }}
          onSelectItem={mockOnSelectItem}
        />
      );

      const grid = document.querySelector('.grid-cols-2.md\\:grid-cols-4');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('item types', () => {
    it('renders image items with correct src and styling', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          itemType="image"
          onSelectItem={mockOnSelectItem}
        />
      );

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('src', 'https://example.com/edited1.jpg');
      expect(images[1]).toHaveAttribute('src', 'https://example.com/edited2.jpg');

      // Check border styling for image type
      const firstItemContainer = images[0].closest('div');
      expect(firstItemContainer).toHaveClass('border-2', 'border-border');
    });

    it('renders source items with correct src and styling', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockSourceItems}
          itemType="source"
          onSelectItem={mockOnSelectItem}
        />
      );

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('src', 'https://example.com/source1.jpg');

      // Check background styling for source type
      const firstItemContainer = images[0].closest('div');
      expect(firstItemContainer).toHaveClass('bg-muted');
    });

    it('shows film icon when no image src', () => {
      const itemsWithoutImages = [
        { id: 'item-1', name: 'No image' },
      ];

      render(
        <MediaGrid
          title="Test"
          items={itemsWithoutImages}
          onSelectItem={mockOnSelectItem}
        />
      );

      // Check for Film icon (it should be in the document)
      const filmIcon = document.querySelector('svg');
      expect(filmIcon).toBeInTheDocument();
    });
  });

  describe('selection states', () => {
    it('shows selection indicator for selected image', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          selectedItemId="item-1"
          itemType="image"
          onSelectItem={mockOnSelectItem}
        />
      );

      // Look for the selection indicator (small circle)
      const selectionIndicator = document.querySelector('.bg-primary.rounded-full');
      expect(selectionIndicator).toBeInTheDocument();
    });

    it('applies selected styling to image items', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          selectedItemId="item-1"
          itemType="image"
          onSelectItem={mockOnSelectItem}
        />
      );

      const firstImage = screen.getAllByRole('img')[0];
      const container = firstImage.closest('div');
      expect(container).toHaveClass('border-primary', 'ring-2', 'ring-primary');
    });

    it('does not show selection indicator when no item selected', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          selectedItemId={null}
          itemType="image"
          onSelectItem={mockOnSelectItem}
        />
      );

      const selectionIndicator = document.querySelector('.bg-primary.rounded-full');
      expect(selectionIndicator).not.toBeInTheDocument();
    });
  });

  describe('hover interactions', () => {
    it('shows edit button on hover when itemActions is "edit"', async () => {
      const user = userEvent.setup();

      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          itemActions="edit"
          onSelectItem={mockOnSelectItem}
          onEditItem={mockOnEditItem}
        />
      );

      const firstItem = screen.getAllByRole('img')[0].closest('div.cursor-pointer')!;
      await user.hover(firstItem);

      const editButton = screen.getByTitle('Edit this image');
      expect(editButton).toBeInTheDocument();
    });

    it('shows remove button on hover when itemActions is "remove"', async () => {
      const user = userEvent.setup();

      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          itemActions="remove"
          onSelectItem={mockOnSelectItem}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      const firstItem = screen.getAllByRole('img')[0].closest('div.cursor-pointer')!;
      await user.hover(firstItem);

      const removeButton = document.querySelector('svg'); // Trash icon
      expect(removeButton).toBeInTheDocument();
    });

    it('shows both buttons on hover when itemActions is "both"', async () => {
      const user = userEvent.setup();

      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          itemActions="both"
          onSelectItem={mockOnSelectItem}
          onEditItem={mockOnEditItem}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      const firstItem = screen.getAllByRole('img')[0].closest('div.cursor-pointer')!;
      await user.hover(firstItem);

      const editButton = screen.getByTitle('Edit this image');
      expect(editButton).toBeInTheDocument();
      // There should be 2 buttons (edit and remove)
      const buttons = document.querySelectorAll('button');
      expect(buttons).toHaveLength(2);
    });

    it('hides overlay when mouse leaves', async () => {
      const user = userEvent.setup();

      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          itemActions="edit"
          onSelectItem={mockOnSelectItem}
          onEditItem={mockOnEditItem}
        />
      );

      const firstItem = screen.getAllByRole('img')[0].closest('div.cursor-pointer')!;
      await user.hover(firstItem);

      let editButton = screen.queryByTitle('Edit this image');
      expect(editButton).toBeInTheDocument();

      await user.unhover(firstItem);

      // The button should be removed or hidden after unhover
      editButton = screen.queryByTitle('Edit this image');
      expect(editButton).not.toBeInTheDocument();
    });
  });

  describe('click handlers', () => {
    it('calls onSelectItem when item is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          onSelectItem={mockOnSelectItem}
        />
      );

      const firstItem = screen.getAllByRole('img')[0].closest('div.cursor-pointer')!;
      await user.click(firstItem);

      expect(mockOnSelectItem).toHaveBeenCalledWith(mockImageItems[0]);
    });

    it('calls onEditItem when edit button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          itemActions="edit"
          onSelectItem={mockOnSelectItem}
          onEditItem={mockOnEditItem}
        />
      );

      const firstItem = screen.getAllByRole('img')[0].closest('div.cursor-pointer')!;
      await user.hover(firstItem);

      // Wait for the button to appear
      const editButton = await screen.findByTitle('Edit this image');
      editButton.click();

      expect(mockOnSelectItem).toHaveBeenCalledWith(mockImageItems[0]);
      expect(mockOnEditItem).toHaveBeenCalledWith(mockImageItems[0]);
    });

    it('calls onRemoveItem when remove button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          itemActions="remove"
          onSelectItem={mockOnSelectItem}
          onRemoveItem={mockOnRemoveItem}
        />
      );

      const firstItem = screen.getAllByRole('img')[0].closest('div.cursor-pointer')!;
      await user.hover(firstItem);

      // The remove button is the only button in the overlay
      const removeButton = document.querySelector('button')!;
      removeButton.click();

      expect(mockOnRemoveItem).toHaveBeenCalledWith('item-1');
    });

    it('calls onNavigateToVideo when video button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          itemActions="edit"
          onSelectItem={mockOnSelectItem}
          onNavigateToVideo={mockOnNavigateToVideo}
        />
      );

      const firstItem = screen.getAllByRole('img')[0].closest('div.cursor-pointer')!;
      await user.hover(firstItem);

      // Wait for the button to appear
      const videoButton = await screen.findByTitle('Generate video from this image');
      videoButton.click();

      expect(mockOnNavigateToVideo).toHaveBeenCalledWith('item-1');
    });
  });

  describe('prompt display', () => {
    it('shows prompt overlay for images when showPrompt is true', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          showPrompt={true}
          onSelectItem={mockOnSelectItem}
        />
      );

      expect(screen.getByText('Beautiful sunset landscape')).toBeInTheDocument();
      expect(screen.getByText('Urban cityscape at night')).toBeInTheDocument();
    });

    it('truncates long prompts', () => {
      const longPromptItem = {
        ...mockImageItems[0],
        prompt: 'A'.repeat(50),
      };

      render(
        <MediaGrid
          title="Test"
          items={[longPromptItem]}
          showPrompt={true}
          onSelectItem={mockOnSelectItem}
        />
      );

      // Should be truncated to 40 characters
      const truncatedPrompt = 'A'.repeat(40);
      expect(screen.getByText(truncatedPrompt)).toBeInTheDocument();
    });

    it('does not show prompts when showPrompt is false', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          showPrompt={false}
          onSelectItem={mockOnSelectItem}
        />
      );

      expect(screen.queryByText('Beautiful sunset landscape')).not.toBeInTheDocument();
    });
  });

  describe('index display', () => {
    it('shows index for source media when showIndex is true', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockSourceItems}
          showIndex={true}
          itemType="source"
          onSelectItem={mockOnSelectItem}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('does not show index when showIndex is false', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockSourceItems}
          showIndex={false}
          itemType="source"
          onSelectItem={mockOnSelectItem}
        />
      );

      expect(screen.queryByText('1')).not.toBeInTheDocument();
      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('sets correct alt text for images', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          onSelectItem={mockOnSelectItem}
        />
      );

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('alt', 'Beautiful sunset landscape');
      expect(images[1]).toHaveAttribute('alt', 'Urban cityscape at night');
    });

    it('sets correct alt text for source items', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockSourceItems}
          itemType="source"
          onSelectItem={mockOnSelectItem}
        />
      );

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('alt', 'Source Video 1');
      expect(images[1]).toHaveAttribute('alt', 'Source Video 2');
    });

    it('makes images non-draggable', () => {
      render(
        <MediaGrid
          title="Test"
          items={mockImageItems}
          onSelectItem={mockOnSelectItem}
        />
      );

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('draggable', 'false');
      expect(images[1]).toHaveAttribute('draggable', 'false');
    });
  });
});
