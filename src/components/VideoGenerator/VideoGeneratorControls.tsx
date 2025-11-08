import { PromptControls } from '../shared/PromptControls';
import { SelectedSource } from './types';

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

export function VideoGeneratorControls({
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
      placeholder="Describe your video vision... For example: 'Create a dynamic product showcase with smooth transitions' or 'Show the product in a lifestyle setting with upbeat energy'"
      onPromptChange={onPromptChange}
      onGenerate={onGenerate}
      icon="play"
      additionalInfo={additionalInfo}
      errorMessage={!canGenerate ? `Select ${maxSelectedSources} image${maxSelectedSources > 1 ? 's' : ''} to generate a video (${selectedSources.length}/${maxSelectedSources})` : undefined}
    />
  );
}

