import { useState } from 'react';
import { Edit2, Video, X, Film, Loader2 } from 'lucide-react';

interface MediaItem {
  id: string;
  name?: string;
  thumbnail?: string;
  prompt?: string;
  edited_url?: string;
}

interface MediaGridProps {
  title: string;
  items: MediaItem[];
  isLoading?: boolean;
  emptyMessage?: {
    title: string;
    subtitle?: string;
  };
  selectedItemId?: string | null;
  onSelectItem?: (item: MediaItem) => void;
  onRemoveItem?: (itemId: string) => void;
  onEditItem?: (item: MediaItem) => void;
  onNavigateToVideo?: (itemId: string) => void;
  showIndex?: boolean;
  gridCols?: {
    default: number;
    md?: number;
  };
  itemActions?: 'edit' | 'remove' | 'both';
  showPrompt?: boolean;
  itemType?: 'image' | 'source';
  isSelectable?: boolean;
}

export function MediaGrid({
  title,
  items,
  isLoading = false,
  emptyMessage = { title: 'No items yet' },
  selectedItemId,
  onSelectItem,
  onRemoveItem,
  onEditItem,
  onNavigateToVideo,
  showIndex = false,
  gridCols = { default: 2, md: 4 },
  itemActions = 'edit',
  showPrompt = false,
  itemType = 'image',
  isSelectable = true,
}: MediaGridProps) {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="border-t border-border pt-4 mt-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div>
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm mb-2">{emptyMessage.title}</p>
          {emptyMessage.subtitle && (
            <p className="text-xs text-muted-foreground/70">{emptyMessage.subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  const getImageSrc = (item: MediaItem) => {
    if (itemType === 'source') {
      return item.thumbnail;
    }
    return item.edited_url;
  };

  const getItemTitle = (item: MediaItem) => {
    if (itemType === 'source') {
      return item.name || 'Source media';
    }
    return item.prompt?.substring(0, 30) || 'Edited image';
  };

  // Determine selected item
  let selectedItem = null;
  if (selectedItemId === null) {
    // Explicitly set to null, no selection - show grid
    selectedItem = null;
  } else {
    // No selectedItemId provided or valid ID provided, select first item or specified item
    selectedItem = selectedItemId ? (items.find((item) => item.id === selectedItemId) || items[0] || null) : (items[0] || null);
  }

  // Preview items are all items except the selected one
  const previewItems = selectedItem ? items.filter((item) => item.id !== selectedItem.id) : [];

  const renderMediaItem = (
    item: MediaItem,
    _index: number,
    isPreview: boolean = false,
    isSelected: boolean = false
  ) => {
    const isHovered = hoveredItemId === item.id;
    const imageSrc = getImageSrc(item);
    const canSelectItem = isSelectable && Boolean(onSelectItem);

    return (
      <div
        key={item.id}
        onClick={canSelectItem ? () => onSelectItem?.(item) : undefined}
        onMouseEnter={() => setHoveredItemId(item.id)}
        onMouseLeave={() => setHoveredItemId(null)}
        className={`relative rounded-lg overflow-hidden transition-all group ${
          isPreview ? 'w-48 h-48' : 'max-w-2xl max-h-96'
        }`}
      >
        {imageSrc ? (
          <div className={`w-full h-full flex items-center justify-center ${
            itemType === 'image'
              ? `border-2 ${isSelected ? 'border-primary ring-2 ring-primary' : 'border-border'} hover:shadow-lg`
              : 'bg-muted'
          } ${
            canSelectItem ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'
          }`}>
            <img
              src={imageSrc}
              alt={getItemTitle(item)}
              className="max-w-full max-h-full object-contain pointer-events-none"
              draggable={false}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Film className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Hover overlay with actions */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity z-10">
            {itemActions === 'remove' && onRemoveItem && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveItem(item.id);
                }}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
            {itemActions === 'edit' && (
              <div className="flex gap-2">
                {onEditItem && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canSelectItem) {
                        onSelectItem?.(item);
                      }
                      onEditItem(item);
                    }}
                    className="p-2 bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                    title="Edit this image"
                  >
                    <Edit2 className="w-4 h-4 text-primary-foreground" />
                  </button>
                )}
                {onNavigateToVideo && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToVideo(item.id);
                    }}
                    className="p-2 bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                    title="Generate video from this image"
                  >
                    <Video className="w-4 h-4 text-primary-foreground" />
                  </button>
                )}
              </div>
            )}
            {itemActions === 'both' && (
              <div className="flex gap-2">
                {onEditItem && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canSelectItem) {
                        onSelectItem?.(item);
                      }
                      onEditItem(item);
                    }}
                    className="p-2 bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                    title="Edit this image"
                  >
                    <Edit2 className="w-4 h-4 text-primary-foreground" />
                  </button>
                )}
                {onRemoveItem && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(item.id);
                    }}
                    className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Selection indicator for images */}
        {itemType === 'image' && isSelected && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center z-10">
            <div className="w-2 h-2 bg-primary-foreground rounded-full" />
          </div>
        )}

        {/* Index indicator for source media */}
        {showIndex && (
          <div className="absolute top-2 left-2 bg-foreground/80 text-background text-xs px-2 py-1 rounded z-10">
            {items.findIndex((i) => i.id === item.id) + 1}
          </div>
        )}

        {/* Prompt preview for images */}
        {showPrompt && item.prompt && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 z-10">
            <p className="text-xs text-white truncate">{item.prompt.substring(0, 40)}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-card">
      <h3 className="text-sm font-medium text-foreground mb-3">{title}</h3>
      <div className="flex gap-4 items-start">
        {/* Left side: Selected media */}
        {selectedItem && (
          <div className="flex-1 min-w-0">
            {renderMediaItem(selectedItem, 0, false, true)}
          </div>
        )}

        {/* Right side: Stacked preview images */}
        {previewItems.length > 0 && (
          <div className="flex-shrink-0 flex flex-col">
            <div className="relative" style={{ width: '192px', height: `${192 + (previewItems.length - 1) * 12}px` }}>
              {previewItems.map((item, index) => (
                <div
                  key={item.id}
                  className="absolute"
                  style={{
                    width: '192px',
                    height: '192px',
                    top: `${index * 12}px`,
                    left: `${index * 12}px`,
                    zIndex: previewItems.length - index,
                  }}
                >
                  {renderMediaItem(item, index, true, false)}
                </div>
              ))}
            </div>
            {selectedItemId && <p className="text-xs text-muted-foreground mt-2">{title}</p>}
          </div>
        )}

        {/* Fallback: If no selected item and no previews, show all items in grid */}
        {!selectedItem && previewItems.length === 0 && (
          <div className={`grid gap-3 w-full ${gridCols.default === 2 ? 'grid-cols-2' : gridCols.default === 4 ? 'grid-cols-4' : 'grid-cols-6'} ${gridCols.md ? (gridCols.md === 4 ? 'md:grid-cols-4' : gridCols.md === 6 ? 'md:grid-cols-6' : '') : ''}`}>
            {items.map((item, index) => renderMediaItem(item, index, false, selectedItemId === item.id))}
          </div>
        )}
      </div>
    </div>
  );
}
