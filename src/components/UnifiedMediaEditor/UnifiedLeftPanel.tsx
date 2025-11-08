import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Upload, RefreshCw } from 'lucide-react';
import { MediaAsset, EditedImage } from '../../types';
import { SelectedSource } from '../VideoGenerator/types';
import { MediaEditorMode } from './types';
import { VersionHistory } from '../ImageEditor/VersionHistory';
import { VideoGeneratorLeftPanel } from '../VideoGenerator/VideoGeneratorLeftPanel';
import { Button } from '../ui/button';
import { useDropzone } from 'react-dropzone';

interface UnifiedLeftPanelProps {
  mode: MediaEditorMode;
  editedImages: EditedImage[];
  mediaAssets: MediaAsset[];
  selectedSources: SelectedSource[];
  isSelecting: boolean;
  projectId: string;
  userId: string | null;
  onDragStart: (e: React.DragEvent, source: SelectedSource) => void;
  onMouseDown: (source: SelectedSource) => void;
  onFileDrop: (files: File[]) => void;
  onRefresh: () => void;
}

export function UnifiedLeftPanel({
  mode,
  editedImages,
  mediaAssets,
  selectedSources,
  isSelecting,
  projectId,
  userId,
  onDragStart,
  onMouseDown,
  onFileDrop,
  onRefresh,
}: UnifiedLeftPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFileDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    noClick: true, // We'll handle click separately
  });

  return (
    <motion.div
      className="w-80 bg-card border-r flex flex-col"
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      exit={{ x: -320 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">
          {mode === 'image-edit' ? 'Version History' : 'Image Library'}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          {mode === 'video-generate' && (
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {mode === 'image-edit' ? (
            <motion.div
              key="version-history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <VersionHistory
                versions={editedImages.map(img => ({
                  prompt: img.prompt,
                  model: img.ai_model || 'unknown',
                  timestamp: img.created_at,
                }))}
                onSelectVersion={() => {}} // Version history is read-only in unified mode
              />
            </motion.div>
          ) : (
            <motion.div
              key="image-library"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <VideoGeneratorLeftPanel
                editedImages={editedImages}
                mediaAssets={mediaAssets}
                selectedSources={selectedSources}
                isSelecting={isSelecting}
                projectId={projectId}
                userId={userId}
                onDragStart={onDragStart}
                onMouseDown={onMouseDown}
                onMouseEnter={() => {}} // Not used in unified mode
                onFileDrop={onFileDrop}
                onRefresh={onRefresh}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Drag overlay for video mode */}
      {mode === 'video-generate' && isDragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center"
        >
          <div className="text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium text-primary">Drop images here</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}