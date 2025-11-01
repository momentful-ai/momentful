import { useRef, useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { EditedImage, MediaAsset } from '../../types';
import { database } from '../../lib/database';
import { isAcceptableImageFile } from '../../lib/media';
import { SelectedSource } from './types';
import { MediaSourceGrid } from './MediaSourceGrid';

interface VideoGeneratorLeftPanelProps {
  editedImages: EditedImage[];
  mediaAssets: MediaAsset[];
  selectedSources: SelectedSource[];
  isSelecting: boolean;
  projectId: string;
  userId: string | null;
  onDragStart: (e: React.DragEvent, source: SelectedSource) => void;
  onMouseDown: (source: SelectedSource) => void;
  onMouseEnter: (source: SelectedSource) => void;
  onFileDrop?: (files: File[]) => Promise<void>;
  onRefresh: () => void;
}

export function VideoGeneratorLeftPanel({
  editedImages,
  mediaAssets,
  selectedSources,
  isSelecting,
  projectId,
  userId,
  onDragStart,
  onMouseDown,
  onMouseEnter,
  onFileDrop,
  onRefresh,
}: VideoGeneratorLeftPanelProps) {
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(280);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [leftPanelTab, setLeftPanelTab] = useState<'edited' | 'library'>('edited');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingLeft]);

  const getAssetUrl = (storagePath: string) => {
    return database.storage.getPublicUrl('user-uploads', storagePath);
  };

  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  };

  const handleFileDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => isAcceptableImageFile(file));

    if (imageFiles.length === 0) {
      return;
    }

    if (!userId) return;

    setIsUploading(true);

    try {
      // If onFileDrop prop is provided, use it (for testing and parent control)
      if (onFileDrop) {
        await onFileDrop(imageFiles);
      } else {
        // Default implementation: upload files directly
        for (const file of imageFiles) {
          try {
            const timestamp = Date.now();
            const fileName = `${timestamp}-${file.name}`;
            const storagePath = `${userId}/${projectId}/${fileName}`;

            await database.storage.upload('user-uploads', storagePath, file);

            const img = new Image();
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = reject;
              img.src = URL.createObjectURL(file);
            });

            await database.mediaAssets.create({
              project_id: projectId,
              user_id: userId,
              file_name: file.name,
              file_type: 'image',
              file_size: file.size,
              storage_path: storagePath,
              width: img.width,
              height: img.height,
            });
          } catch (error) {
            console.error('Error uploading file:', error);
          }
        }
      }
    } finally {
      setIsUploading(false);
      onRefresh();
    }
  };

  return (
    <aside
      ref={leftPanelRef}
      style={{ width: `${leftPanelWidth}px` }}
      className="bg-card border-r border-border flex flex-col overflow-hidden relative"
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
        onDragOver={handleFileDragOver}
        onDragLeave={handleFileDragLeave}
        onDrop={handleFileDrop}
      >
        {isDraggingFile && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10 m-4">
            <div className="text-center">
              <Upload className="w-12 h-12 text-primary mx-auto mb-2" />
              <p className="text-primary font-medium">Drop images here to upload</p>
            </div>
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20 m-4 rounded-lg">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-foreground font-medium">Uploading...</p>
            </div>
          </div>
        )}
        {leftPanelTab === 'edited' ? (
          <MediaSourceGrid
            sources={editedImages.map((img) => ({
              id: img.id,
              thumbnail: img.edited_url,
              name: img.prompt.substring(0, 30),
            }))}
            selectedSources={selectedSources}
            isSelecting={isSelecting}
            onDragStart={onDragStart}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            getSource={(item) => ({
              id: item.id,
              type: 'edited_image',
              thumbnail: item.thumbnail,
              name: item.name,
            })}
            emptyMessage="No edited images yet"
            emptyHint="Drag and drop images here to upload"
          />
        ) : (
          <MediaSourceGrid
            sources={mediaAssets}
            selectedSources={selectedSources}
            isSelecting={isSelecting}
            onDragStart={onDragStart}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            getSource={(asset) => ({
              id: asset.id,
              type: 'media_asset',
              thumbnail: getAssetUrl(asset.storage_path),
              name: asset.file_name,
            })}
            emptyMessage="No library images yet"
            emptyHint="Drag and drop images here to upload"
          />
        )}

        {/* Upload hint */}
        {(editedImages.length > 0 || mediaAssets.length > 0) && (
          <div className="px-4 pb-3 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground/70 text-center">
              Drag images here to upload or drag to canvas to add
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

