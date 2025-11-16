import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Upload, Check } from 'lucide-react';
import { MediaAsset, EditedImage } from '../../types';
import { SelectedSource, MediaEditorMode } from './types';
import { useDropzone } from 'react-dropzone';

interface ThumbnailImageProps {
  src?: string;
  storagePath?: string;
  alt: string;
  className?: string;
  getAssetUrl: (storagePath: string) => Promise<string>;
}

function ThumbnailImage({ src, storagePath, alt, className, getAssetUrl }: ThumbnailImageProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(src || '');
  const [isUrlLoading, setIsUrlLoading] = useState(false);

  useEffect(() => {
    // Handle pre-computed URLs first
    if (src) {
      setThumbnailUrl(src);
      setIsUrlLoading(false);
      return;
    }

    // If we have a storagePath, load signed URL
    if (storagePath) {
      setIsUrlLoading(true);
      getAssetUrl(storagePath)
        .then(setThumbnailUrl)
        .catch((error) => {
          console.error('Failed to load thumbnail URL:', error);
          setThumbnailUrl('');
        })
        .finally(() => setIsUrlLoading(false));
    } else {
      setThumbnailUrl('');
      setIsUrlLoading(false);
    }
  }, [src, storagePath, getAssetUrl]);

  if (isUrlLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (thumbnailUrl) {
    return (
      <img
        src={thumbnailUrl}
        alt={alt}
        className={className}
        draggable={false}
      />
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full text-muted-foreground text-xs">
      No image
    </div>
  );
}

interface MediaSourceItem {
  id: string;
  thumbnail?: string;
  storagePath?: string;
  name: string;
}

interface MediaSourceGridProps {
  sources: MediaSourceItem[];
  selectedSources: SelectedSource[];
  isSelecting: boolean;
  onDragStart: (e: React.DragEvent, source: SelectedSource) => void;
  onMouseDown: (source: SelectedSource) => void;
  onMouseEnter: (source: SelectedSource) => void;
  getSource: (item: MediaSourceItem) => SelectedSource;
  emptyMessage: string;
  emptyHint: string;
  getAssetUrl: (storagePath: string) => Promise<string>;
}

function MediaSourceGrid({
  sources,
  selectedSources,
  isSelecting,
  onDragStart,
  onMouseDown,
  onMouseEnter,
  getSource,
  emptyMessage,
  emptyHint,
  getAssetUrl,
}: MediaSourceGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {sources.map((item) => {
        const source = getSource(item);
        const isSelected = selectedSources.find((s) => s.id === item.id);
        return (
          <div
            key={item.id}
            draggable={!isSelecting}
            onDragStart={(e) => !isSelecting && onDragStart(e, source)}
            onMouseDown={(e) => {
              e.preventDefault();
              onMouseDown(source);
            }}
            onMouseEnter={() => onMouseEnter(source)}
            className={`relative w-full max-h-32 rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
              isSelected ? 'border-primary ring-2 ring-primary' : 'border-border'
            }`}
          >
            <div className="w-full h-full flex items-center justify-center">
              <ThumbnailImage
                src={item.thumbnail}
                storagePath={item.storagePath}
                alt={source.name}
                className="max-w-full max-h-full object-contain pointer-events-none"
                getAssetUrl={getAssetUrl}
              />
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </div>
        );
      })}
      {sources.length === 0 && (
        <div className="col-span-2 text-center py-8">
          <p className="text-muted-foreground text-sm mb-2">{emptyMessage}</p>
          <p className="text-xs text-muted-foreground/70">{emptyHint}</p>
        </div>
      )}
    </div>
  );
}

interface UnifiedLeftPanelProps {
  mode: MediaEditorMode;
  editedImages: EditedImage[];
  mediaAssets: MediaAsset[];
  selectedSources: SelectedSource[];
  isSelecting: boolean;
  onDragStart: (e: React.DragEvent, source: SelectedSource) => void;
  onMouseDown: (source: SelectedSource) => void;
  onFileDrop: (files: File[]) => Promise<void>;
  onRefresh: () => void;
  getAssetUrl: (storagePath: string) => Promise<string>;
}

export function UnifiedLeftPanel({
  mode,
  editedImages,
  mediaAssets,
  selectedSources,
  isSelecting,
  onDragStart,
  onMouseDown,
  onFileDrop,
  onRefresh: _onRefresh, // eslint-disable-line @typescript-eslint/no-unused-vars
  getAssetUrl,
}: UnifiedLeftPanelProps) {
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(280);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [leftPanelTab, setLeftPanelTab] = useState<'edited' | 'library'>('edited');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= 400) {
          setLeftPanelWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
    };

    if (isResizingLeft) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft]);

  const { isDragActive } = useDropzone({
    onDrop: onFileDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    noClick: true,
  });

  // The editedImages prop is already filtered appropriately by the parent component
  const displayEditedImages = editedImages;

  return (
    <motion.div
      ref={leftPanelRef}
      className="bg-card border-r border-border flex flex-col overflow-hidden relative"
      style={{ width: `${leftPanelWidth}px` }}
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      exit={{ x: -320 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50 transition-colors z-10"
        onMouseDown={() => setIsResizingLeft(true)}
      />

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          <button
            onClick={() => setLeftPanelTab('edited')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              leftPanelTab === 'edited'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Edited Images
            {leftPanelTab === 'edited' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setLeftPanelTab('library')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              leftPanelTab === 'library'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Library
            {leftPanelTab === 'library' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto p-4 relative"
        style={{ userSelect: 'none' }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
      >
        {leftPanelTab === 'edited' ? (
          <MediaSourceGrid
            sources={displayEditedImages.map((img) => ({
              id: img.id,
              thumbnail: img.edited_url,
              storagePath: img.edited_url ? undefined : img.storage_path,
              name: img.prompt.substring(0, 30),
            }))}
            selectedSources={selectedSources}
            isSelecting={isSelecting}
            onDragStart={onDragStart}
            onMouseDown={onMouseDown}
            onMouseEnter={() => {}} // Not used in unified mode
            getSource={(item) => ({
              id: item.id,
              type: 'edited_image',
              thumbnail: item.thumbnail,
              name: item.name,
            })}
            emptyMessage={mode === 'image-edit' ? "No versions yet" : "No edited images yet"}
            emptyHint={mode === 'image-edit' ? "Generate your first edit above" : "Upload images to get started"}
            getAssetUrl={getAssetUrl}
          />
        ) : (
          <MediaSourceGrid
            sources={mediaAssets.map((asset) => ({
              id: asset.id,
              thumbnail: asset.thumbnail_url,
              storagePath: asset.thumbnail_url ? undefined : asset.storage_path,
              name: asset.file_name,
            }))}
            selectedSources={selectedSources}
            isSelecting={isSelecting}
            onDragStart={onDragStart}
            onMouseDown={onMouseDown}
            onMouseEnter={() => {}} // Not used in unified mode
            getSource={(item) => ({
              id: item.id,
              type: 'media_asset',
              thumbnail: item.thumbnail,
              name: item.name,
            })}
            emptyMessage="No images in library"
            emptyHint="Upload images to get started"
            getAssetUrl={getAssetUrl}
          />
        )}

        {/* Drag overlay */}
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10 m-4"
          >
            <div className="text-center">
              <Upload className="w-12 h-12 text-primary mx-auto mb-2" />
              <p className="text-primary font-medium">Drop images here to upload</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}