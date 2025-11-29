import { useRef, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Card } from '../ui/card';
import { MediaCard, MediaCardItem } from './MediaCard';
import { DropzoneOverlay } from '../MediaLibrary/DropzoneOverlay';
import { useGridConfig } from '../../hooks/useGridConfig';

interface UnifiedMediaGridProps {
    items: MediaCardItem[];
    viewMode: 'grid' | 'list';
    onEditImage?: (item: MediaCardItem) => void;
    onDelete?: (item: MediaCardItem) => void;
    onDownload?: (item: MediaCardItem) => void;
    getAssetUrl: (storagePath: string) => Promise<string>;
    // Optional upload props
    onDrop?: (files: File[]) => void;
    isUploading?: boolean;
    emptyState?: {
        title: string;
        description: string;
        icon?: React.ReactNode;
    };
}

export function UnifiedMediaGrid({
    items,
    viewMode,
    onEditImage,
    onDelete,
    onDownload,
    getAssetUrl,
    onDrop,
    isUploading = false,
    emptyState = {
        title: 'No items yet',
        description: 'Upload or generate content to get started',
    }
}: UnifiedMediaGridProps) {
    const [isDragging, setIsDragging] = useState(false);
    const parentRef = useRef<HTMLDivElement>(null);

    // Get grid configuration for grid view
    const gridConfig = useGridConfig(parentRef, items.length, 250);

    // Single virtualizer with mode-specific config
    const virtualizer = useVirtualizer(useMemo(() => ({
        count: viewMode === 'grid' ? (gridConfig?.rows ?? 0) : items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => viewMode === 'grid' ? (gridConfig?.rowHeight ?? 300) : 100,
    }), [gridConfig, viewMode, items.length]));

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDrop && e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget === e.target) {
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0 && onDrop) {
            onDrop(files);
        }
    };

    const renderCard = (item: MediaCardItem) => (
        <MediaCard
            key={item.id}
            item={item}
            viewMode={viewMode}
            isSelected={false}
            onClick={() => onEditImage?.(item)}
            onEditImage={onEditImage}
            onDownload={onDownload}
            onDelete={onDelete}
            getAssetUrl={getAssetUrl}
        />
    );

    if (items.length === 0) {
        return (
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="relative"
            >
                {onDrop && <DropzoneOverlay isVisible={isDragging} />}
                {isUploading && (
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-xl font-semibold">Uploading...</p>
                        </div>
                    </div>
                )}
                <Card className="border-2 border-dashed p-12 text-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        {emptyState.icon || <ImageIcon className="w-10 h-10 text-muted-foreground" />}
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">
                        {emptyState.title}
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto text-lg mb-2">
                        {emptyState.description}
                    </p>
                    {onDrop && (
                        <p className="text-muted-foreground/60 flex items-center gap-2 justify-center">
                            <Upload className="w-4 h-4" />
                            Drag images here to upload
                        </p>
                    )}
                </Card>
            </div>
        );
    }

    return (
        <div
            ref={parentRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative h-full overflow-y-auto"
        >
            {onDrop && <DropzoneOverlay isVisible={isDragging} />}
            {isUploading && (
                <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-card rounded-xl p-8 shadow-2xl">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-xl font-semibold">Uploading...</p>
                    </div>
                </div>
            )}

            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                    if (viewMode === 'list') {
                        const item = items[virtualItem.index];
                        if (!item) return null;

                        return (
                            <div
                                key={item.id}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualItem.size} px`,
                                    transform: `translateY(${virtualItem.start}px)`,
                                }}
                            >
                                {renderCard(item)}
                            </div>
                        );
                    } else {
                        if (!gridConfig) return null;

                        const startIndex = virtualItem.index * gridConfig.columns;
                        const endIndex = Math.min(startIndex + gridConfig.columns, items.length);

                        return (
                            <div
                                key={virtualItem.index}
                                className="grid gap-4"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualItem.size}px`,
                                    transform: `translateY(${virtualItem.start}px)`,
                                    gridTemplateColumns: `repeat(${gridConfig.columns}, minmax(0, 1fr))`,
                                }}
                            >
                                {items.slice(startIndex, endIndex).map(renderCard)}
                            </div>
                        );
                    }
                })}
            </div>
        </div>
    );
}
