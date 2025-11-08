import { motion, AnimatePresence } from 'framer-motion';
import { MediaEditorMode } from './types';
import { ImageEditorPreview } from '../ImageEditor/ImageEditorPreview';
import { VideoGeneratorPreview } from '../VideoGenerator/VideoGeneratorPreview';

interface UnifiedPreviewProps {
  mode: MediaEditorMode;

  // Image mode props
  originalImageUrl?: string;
  editedImageUrl?: string | null;
  showComparison?: boolean;
  fileName?: string;

  // Video mode props
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5';
  generatedVideoUrl?: string | null;
  videoError?: boolean;
  isGenerating?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onRetryVideo?: () => void;
  onVideoError?: () => void;
}

export function UnifiedPreview({
  mode,
  originalImageUrl,
  editedImageUrl,
  showComparison,
  fileName,
  aspectRatio,
  generatedVideoUrl,
  videoError,
  isGenerating,
  onDragOver,
  onDrop,
  onRetryVideo,
  onVideoError,
}: UnifiedPreviewProps) {
  return (
    <div className="h-full p-6">
      <AnimatePresence mode="wait">
        {mode === 'image-edit' ? (
          <motion.div
            key="image-preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full"
          >
            {originalImageUrl && (
              <ImageEditorPreview
                originalImageUrl={originalImageUrl}
                editedImageUrl={editedImageUrl}
                showComparison={showComparison || false}
                fileName={fileName || ''}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="video-preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full"
          >
            <VideoGeneratorPreview
              aspectRatio={aspectRatio || '9:16'}
              generatedVideoUrl={generatedVideoUrl}
              videoError={videoError || false}
              isGenerating={isGenerating || false}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onRetryVideo={onRetryVideo}
              onVideoError={onVideoError}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}