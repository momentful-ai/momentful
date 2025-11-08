import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EditedImage, MediaAsset } from '../../types';
import { EditorMode } from './types';
import { ImageEditorImageList } from '../ImageEditor/ImageEditorImageList';
import { VideoGeneratorLeftPanel } from '../VideoGenerator/VideoGeneratorLeftPanel';
import { SelectedSource } from '../VideoGenerator/types';

interface UnifiedLeftPanelProps {
  mode: EditorMode;
  editingHistory: EditedImage[];
  editedImages: EditedImage[];
  mediaAssets: MediaAsset[];
  selectedImageId: string | null;
  selectedImages: string[];
  projectId: string;
  userId: string | null;
  onEditImage: (image: EditedImage) => void;
  onSelectImage: (imageId: string) => void;
  onNavigateToVideo?: (imageId: string) => void;
  onFileDrop?: (files: File[]) => Promise<void>;
  onRefresh?: () => void;
}

export function UnifiedLeftPanel({
  mode,
  editingHistory,
  editedImages,
  mediaAssets,
  selectedImageId,
  selectedImages,
  projectId,
  userId,
  onEditImage,
  onSelectImage,
  onNavigateToVideo,
  onFileDrop,
  onRefresh
}: UnifiedLeftPanelProps) {
  const isLoadingHistory = false;

  // Video generation state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'add' | 'remove'>('add');
  const selectionStartRef = useRef<string | null>(null);

  const handleDragStart = (e: React.DragEvent, source: SelectedSource) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(source));
  };

  const handleMouseDown = (source: SelectedSource) => {
    const isSelected = selectedImages.includes(source.id);

    if (isSelected) {
      // Allow unselecting
      const newSelected = selectedImages.filter(id => id !== source.id);
      // Since we only support single selection for now, clear all
      onSelectImage('');
    } else {
      // Single selection mode - replace current selection
      onSelectImage(source.id);
    }
  };

  const handleMouseEnter = (source: SelectedSource) => {
    if (!isSelecting) return;

    const isSelected = selectedImages.includes(source.id);

    if (selectionMode === 'add' && !isSelected) {
      onSelectImage(source.id);
    } else if (selectionMode === 'remove' && isSelected) {
      const newSelected = selectedImages.filter(id => id !== source.id);
      // For now, just select the new one
      onSelectImage(source.id);
    }
  };

  const handleFileDropInternal = async (files: File[]) => {
    if (onFileDrop) {
      await onFileDrop(files);
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const selectedSources: SelectedSource[] = selectedImages.map(id => {
    const editedImage = editedImages.find(img => img.id === id);
    return {
      id,
      type: 'edited_image' as const,
      thumbnail: editedImage?.edited_url,
      name: editedImage?.prompt.substring(0, 30) || 'Untitled'
    };
  });

  useEffect(() => {
    if (isSelecting) {
      const handleMouseUp = () => {
        setIsSelecting(false);
        selectionStartRef.current = null;
      };
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isSelecting]);

  return (
    <motion.div
      className="flex-none w-80 border-r bg-card overflow-hidden"
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      exit={{ x: -320 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {mode === 'image' ? (
        <div className="h-full flex flex-col">
          <div className="flex-none px-4 py-3 border-b">
            <h3 className="font-medium text-sm text-muted-foreground">Version History</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ImageEditorImageList
              editedImages={editingHistory}
              isLoading={isLoadingHistory}
              selectedImageId={selectedImageId}
              onEditImage={onEditImage}
              onNavigateToVideo={onNavigateToVideo}
            />
          </div>
        </div>
      ) : (
        <VideoGeneratorLeftPanel
          editedImages={editedImages}
          mediaAssets={mediaAssets}
          selectedSources={selectedSources}
          isSelecting={isSelecting}
          projectId={projectId || ''}
          userId={userId || null}
          onDragStart={handleDragStart}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onFileDrop={handleFileDropInternal}
          onRefresh={handleRefresh}
        />
      )}
    </motion.div>
  );
}