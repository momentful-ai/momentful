import { PromptControls } from '../shared/PromptControls';
import { MediaGrid } from '../shared';
import { SelectedSource } from './types';

interface VideoGeneratorControlsProps {
  prompt: string;
  cameraMovement: string;
  canGenerate: boolean;
  isGenerating: boolean;
  selectedSources: SelectedSource[];
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onRemoveSource: (id: string) => void;
}

export function VideoGeneratorControls({
  prompt,
  cameraMovement,
  canGenerate,
  isGenerating,
  selectedSources,
  onPromptChange,
  onGenerate,
  onRemoveSource,
}: VideoGeneratorControlsProps) {
  const additionalInfo = cameraMovement.replace('-', ' ');

  return (
    <PromptControls
      prompt={prompt}
      isGenerating={isGenerating}
      canGenerate={canGenerate}
      generateLabel="Generate Video"
      generatingLabel="Generating Video..."
      placeholder="Describe your video vision... For example: 'Create a dynamic product showcase with smooth transitions' or 'Show the product in a lifestyle setting with upbeat energy'"
      onPromptChange={onPromptChange}
      onGenerate={onGenerate}
      icon="play"
      additionalInfo={additionalInfo}
      errorMessage={!canGenerate ? 'Add at least one image to generate video' : undefined}
    >
      {selectedSources.length > 0 && (
        <MediaGrid
          title="Source Media"
          items={selectedSources}
          onRemoveItem={onRemoveSource}
          showIndex={true}
          gridCols={{ default: 4, md: 6 }}
          itemActions="remove"
          itemType="source"
        />
      )}
    </PromptControls>
  );
}

