import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedMediaGrid } from '../../../components/shared/UnifiedMediaGrid';
import { MediaCardItem } from '../../../components/shared/MediaCard';

// Mock ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    })),
});

// Mock useGridConfig
vi.mock('../../../hooks/useGridConfig', () => ({
  useGridConfig: vi.fn(() => ({
    columns: 2,
    rows: 1,
    rowHeight: 300,
  })),
}));

// Mock virtualizer
vi.mock('@tanstack/react-virtual', () => ({
    useVirtualizer: vi.fn((options: Record<string, unknown>) => {
        if (options.count === 0) {
            return {
                getVirtualItems: () => [],
                getTotalSize: () => 0,
            };
        }
        return {
            getVirtualItems: () => [
                { index: 0, start: 0, size: 300, measureElement: vi.fn() },
                { index: 1, start: 300, size: 300, measureElement: vi.fn() },
            ],
            getTotalSize: () => 600,
        };
    }),
}));

// Mock MediaCard
vi.mock('../../../components/shared/MediaCard', () => ({
    MediaCard: ({ item, onClick, onEditImage }: { item: MediaCardItem; onClick?: () => void; onEditImage?: (item: MediaCardItem) => void }) => (
        <div data-testid={`media-card-${item.id}`} onClick={onClick}>
            {item.id}
            {onEditImage && (
                <button data-testid={`edit-btn-${item.id}`} onClick={(e) => { e.stopPropagation(); onEditImage(item); }}>
                    Edit
                </button>
            )}
        </div>
    ),
}));

describe('UnifiedMediaGrid', () => {
    const mockItems: MediaCardItem[] = [
        {
            id: '1',
            file_name: 'test1.jpg',
            file_type: 'image',
            storage_path: 'path/1',
            created_at: new Date().toISOString(),
            file_size: 100,
            project_id: 'p1',
            user_id: 'u1',
            sort_order: 0,
        },
        {
            id: '2',
            file_name: 'test2.jpg',
            file_type: 'image',
            storage_path: 'path/2',
            created_at: new Date().toISOString(),
            file_size: 100,
            project_id: 'p1',
            user_id: 'u1',
            sort_order: 0,
        },
    ];

    const defaultProps = {
        items: mockItems,
        viewMode: 'grid' as const,
        getAssetUrl: async () => 'url',
    };

    it('renders items', () => {
        render(<UnifiedMediaGrid {...defaultProps} />);
        expect(screen.getByTestId('media-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('media-card-2')).toBeInTheDocument();
    });

    it('handles click to edit when onEditImage is provided', () => {
        const onEditImage = vi.fn();
        render(<UnifiedMediaGrid {...defaultProps} onEditImage={onEditImage} />);

        fireEvent.click(screen.getByTestId('media-card-1'));
        expect(onEditImage).toHaveBeenCalledWith(mockItems[0]);
    });

    it('renders empty state', () => {
        render(<UnifiedMediaGrid {...defaultProps} items={[]} />);
        expect(screen.getByText('No items yet')).toBeInTheDocument();
    });
});
