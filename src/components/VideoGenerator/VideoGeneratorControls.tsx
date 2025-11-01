import { PromptControls } from '../shared/PromptControls';

interface VideoGeneratorControlsProps {
  prompt: string;
  selectedModel: string;
  sceneType: string;
  cameraMovement: string;
  canGenerate: boolean;
  isGenerating: boolean;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
}

export function VideoGeneratorControls({
  prompt,
  selectedModel,
  sceneType,
  cameraMovement,
  canGenerate,
  isGenerating,
  onPromptChange,
  onGenerate,
}: VideoGeneratorControlsProps) {
  const additionalInfo = `${sceneType.replace('-', ' ')} • ${cameraMovement.replace('-', ' ')}`;

  return (
    <PromptControls
      prompt={prompt}
      selectedModelName={selectedModel}
      isGenerating={isGenerating}
      canGenerate={canGenerate}
      generateLabel="Generate Video"
      generatingLabel="Generating Video..."
      placeholder="Describe your video vision... For example: 'Create a dynamic product showcase with smooth transitions' or 'Show the product in a lifestyle setting with upbeat energy'"
      onPromptChange={onPromptChange}
      onGenerate={onGenerate}
      icon="play"
      additionalInfo={additionalInfo}
      errorMessage={!canGenerate ? 'Add at least one image or clip to generate video' : undefined}
    />
  );
}

