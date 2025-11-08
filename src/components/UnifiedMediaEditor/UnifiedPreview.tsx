import { motion, AnimatePresence } from 'framer-motion';
import { ImageEditorPreview } from '../ImageEditor/ImageEditorPreview';
import { VideoGeneratorPreview } from '../VideoGenerator/VideoGeneratorPreview';
import { EditorMode } from './types';

interface UnifiedPreviewProps {
  mode: EditorMode;
  originalImageUrl: string | null;
  editedImageUrl: string | null;
  showComparison: boolean;
  fileName?: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  generatedVideoUrl: string | null;
  videoError: boolean;
  isGenerating: boolean;
  onVideoError: () => void;
  onRetryVideo: () => void;
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
  onVideoError,
  onRetryVideo
}: UnifiedPreviewProps) {
  return (
    <AnimatePresence mode="wait">
      {mode === 'image' ? (
        <motion.div
          key="image-preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
            {originalImageUrl ? (
              <ImageEditorPreview
                originalImageUrl={originalImageUrl}
                editedImageUrl={editedImageUrl}
                showComparison={showComparison}
                fileName={fileName}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-muted/20">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg font-medium mb-2">No image selected</p>
                  <p className="text-sm">Select an image from the left panel to start editing</p>
                </div>
              </div>
            )}
        </motion.div>
      ) : (
        <motion.div
          key="video-preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <VideoGeneratorPreview
            aspectRatio={aspectRatio}
            generatedVideoUrl={generatedVideoUrl}
            videoError={videoError}
            isGenerating={isGenerating}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()} // TODO: Implement drop functionality
            onRetryVideo={onRetryVideo}
            onVideoError={onVideoError}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}