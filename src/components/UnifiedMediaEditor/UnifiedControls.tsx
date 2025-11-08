import { motion, AnimatePresence } from 'framer-motion';
import { MediaEditorMode, SelectedSource } from './types';
import { PromptControls } from '../shared/PromptControls';

interface VideoGeneratorControlsProps {
  prompt: string;
  cameraMovement: string;
  canGenerate: boolean;
  isGenerating: boolean;
  selectedSources: SelectedSource[];
  maxSelectedSources: number;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onRemoveSource: (id: string) => void;
}

function VideoGeneratorControls({
  prompt,
  cameraMovement,
  canGenerate,
  isGenerating,
  selectedSources,
  maxSelectedSources,
  onPromptChange,
  onGenerate,
  onRemoveSource: _onRemoveSource, // eslint-disable-line @typescript-eslint/no-unused-vars
}: VideoGeneratorControlsProps) {
  const additionalInfo = cameraMovement.replace('-', ' ');

  return (
    <PromptControls
      prompt={prompt}
      isGenerating={isGenerating}
      canGenerate={canGenerate}
      generateLabel="Generate Video"
      generatingLabel="Generating Video..."
      placeholder="Describe your product. For example: 'A pair of shoes' or 'A candle' or 'A mug' on a table."
      onPromptChange={onPromptChange}
      onGenerate={onGenerate}
      icon="play"
      additionalInfo={additionalInfo}
      errorMessage={!canGenerate ? `Select ${maxSelectedSources} image${maxSelectedSources > 1 ? 's' : ''} to generate a video (${selectedSources.length}/${maxSelectedSources})` : undefined}
    />
  );
}

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
            errorMessage={!canGenerate ? "Please enter a prompt to generate an image" : undefined}
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