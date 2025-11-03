import { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { MediaAsset } from '../../types';
import { Card } from '../ui/card';
import { MediaCard } from '../shared/MediaCard';
import { DropzoneOverlay } from './DropzoneOverlay';
import { useGridConfig } from './useGridConfig';

interface MediaLibraryViewProps {
  assets: MediaAsset[];
  viewMode: 'grid' | 'list';
  isUploading: boolean;
  projectId: string;
  onDrop: (files: File[]) => void;
  onEditImage?: (asset: MediaAsset, projectId: string) => void;
  onRequestDelete: (assetId: string, storagePath: string) => void;
  onDownload?: (asset: MediaAsset) => void;
  getAssetUrl: (storagePath: string) => string;
}

export function MediaLibraryView({
  assets,
  viewMode,
  isUploading,
  projectId,
  onDrop,
  onEditImage,
  onRequestDelete,
  onDownload,
  getAssetUrl,
}: MediaLibraryViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  // Get grid configuration for grid view
  const gridConfig = useGridConfig(parentRef, assets.length);

  // Single virtualizer with mode-specific config
  const virtualizer = useVirtualizer({
    count: viewMode === 'grid' ? (gridConfig?.rows ?? 0) : assets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => viewMode === 'grid' ? (gridConfig?.rowHeight ?? 200) : 128,
  });

  // Shared card renderer to avoid duplication
  const renderAssetCard = (asset: MediaAsset) => (
    <MediaCard
      key={asset.id}
      item={asset}
      viewMode={viewMode}
      isSelected={false}
      onClick={() => {
        if (asset.file_type === 'image' && onEditImage) {
          onEditImage(asset, projectId);
        }
      }}
      onEditImage={onEditImage ? (item) => {
        if ('file_type' in item) {
          onEditImage(item, projectId);
        }
      } : undefined}
      onDownload={onDownload ? (item) => {
        if ('file_type' in item) {
          onDownload(item);
        }
      } : undefined}
      onDelete={() => onRequestDelete(asset.id, asset.storage_path)}
      getAssetUrl={getAssetUrl}
    />
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
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
    if (files.length > 0) {
      onDrop(files);
    }
  };

  if (assets.length === 0) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative"
      >
        <DropzoneOverlay isVisible={isDragging} />
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
            <ImageIcon className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">
            No uploaded images yet
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto text-lg mb-2">
            Upload images to get started with your project
          </p>
          <p className="text-muted-foreground/60 flex items-center gap-2 justify-center">
            <Upload className="w-4 h-4" />
            Drag images here to upload
          </p>
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
      className="relative"
    >
      <DropzoneOverlay isVisible={isDragging} />
      {isUploading && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card rounded-xl p-8 shadow-2xl">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xl font-semibold">Uploading...</p>
          </div>
        </div>
      )}

      {/* Single virtualized container */}
      <div
        ref={parentRef}
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          if (viewMode === 'list') {
            // List view: render single asset per virtual item
            const asset = assets[virtualItem.index];
            if (!asset) return null;

            return (
              <div
                key={asset.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {renderAssetCard(asset)}
              </div>
            );
          } else {
            // Grid view: render row of assets per virtual item
            if (!gridConfig) return null;

            const startIndex = virtualItem.index * gridConfig.columns;
            const endIndex = Math.min(startIndex + gridConfig.columns, assets.length);

            return (
              <div
                key={virtualItem.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              >
                {assets.slice(startIndex, endIndex).map(renderAssetCard)}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
