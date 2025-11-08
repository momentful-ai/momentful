import { motion, AnimatePresence } from 'framer-motion';
import { MediaEditorMode } from './types';
import { SelectedSource } from '../VideoGenerator/types';
import { PromptControls } from '../shared/PromptControls';
import { VideoGeneratorControls } from '../VideoGenerator/VideoGeneratorControls';

interface UnifiedControlsProps {
  mode: MediaEditorMode;

  // Shared props
  prompt: string;
  isGenerating: boolean;
  canGenerate: boolean;
  generateLabel: string;
  generatingLabel: string;
  placeholder: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;

  // Video mode props
  cameraMovement?: string;
  selectedSources?: SelectedSource[];
  maxSelectedSources?: number;
  onRemoveSource?: (id: string) => void;
}

export function UnifiedControls({
  mode,
  prompt,
  isGenerating,
  canGenerate,
  generateLabel,
  generatingLabel,
  placeholder,
  onPromptChange,
  onGenerate,
  cameraMovement,
  selectedSources,
  maxSelectedSources,
  onRemoveSource,
}: UnifiedControlsProps) {
  return (
    <AnimatePresence mode="wait">
      {mode === 'image-edit' ? (
        <motion.div
          key="image-controls"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <PromptControls
            prompt={prompt}
            isGenerating={isGenerating}
            canGenerate={canGenerate}
            generateLabel={generateLabel}
            generatingLabel={generatingLabel}
            placeholder={placeholder}
            onPromptChange={onPromptChange}
            onGenerate={onGenerate}
            icon="wand"
          />
        </motion.div>
      ) : (
        <motion.div
          key="video-controls"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <VideoGeneratorControls
            prompt={prompt}
            cameraMovement={cameraMovement || 'dynamic'}
            canGenerate={canGenerate}
            isGenerating={isGenerating}
            selectedSources={selectedSources || []}
            maxSelectedSources={maxSelectedSources || 1}
            onPromptChange={onPromptChange}
            onGenerate={onGenerate}
            onRemoveSource={onRemoveSource || (() => {})}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}