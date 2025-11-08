import { motion, AnimatePresence } from 'framer-motion';
import { MediaEditorMode } from './types';
import { VersionHistoryItem } from './types';
import { ImageEditorSidebar } from '../ImageEditor/ImageEditorSidebar';
import { VideoGeneratorSidebar } from '../VideoGenerator/VideoGeneratorSidebar';

interface UnifiedSidebarProps {
  mode: MediaEditorMode;

  // Image mode props
  selectedRatio?: string;
  versions?: VersionHistoryItem[];
  onRatioChange?: (ratio: string) => void;

  // Video mode props
  selectedModel?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5';
  cameraMovement?: string;
  onModelChange?: (model: string) => void;
  onAspectRatioChange?: (ratio: '16:9' | '9:16' | '1:1' | '4:5') => void;
  onCameraMovementChange?: (movement: string) => void;
}

export function UnifiedSidebar({
  mode,
  selectedRatio,
  versions,
  onRatioChange,
  selectedModel,
  aspectRatio,
  cameraMovement,
  onModelChange,
  onAspectRatioChange,
  onCameraMovementChange,
}: UnifiedSidebarProps) {
  return (
    <motion.div
      className="w-80 bg-card border-l"
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      exit={{ x: 320 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <AnimatePresence mode="wait">
        {mode === 'image-edit' ? (
          <motion.div
            key="image-sidebar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <ImageEditorSidebar
              selectedRatio={selectedRatio || '1:1'}
              versions={versions || []}
              onRatioChange={onRatioChange || (() => {})}
            />
          </motion.div>
        ) : (
          <motion.div
            key="video-sidebar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <VideoGeneratorSidebar
              selectedModel={selectedModel || 'gen-3-alpha-turbo'}
              aspectRatio={aspectRatio || '9:16'}
              cameraMovement={cameraMovement || 'dynamic'}
              onModelChange={onModelChange || (() => {})}
              onAspectRatioChange={onAspectRatioChange || (() => {})}
              onCameraMovementChange={onCameraMovementChange || (() => {})}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}