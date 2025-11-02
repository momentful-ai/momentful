import { ResizableSidebar } from '../shared/ResizableSidebar';
import { AIModelSelector } from '../shared/AIModelSelector';
import { AspectRatioSelector } from './AspectRatioSelector';
import { CameraMovementSelector } from './CameraMovementSelector';
import { videoModels } from '../../data/aiModels';

interface VideoGeneratorSidebarProps {
  selectedModel: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  cameraMovement: string;
  onModelChange: (modelId: string) => void;
  onAspectRatioChange: (ratio: '16:9' | '9:16' | '1:1' | '4:5') => void;
  onCameraMovementChange: (movement: string) => void;
}

export function VideoGeneratorSidebar({
  selectedModel,
  aspectRatio,
  cameraMovement,
  onModelChange,
  onAspectRatioChange,
  onCameraMovementChange,
}: VideoGeneratorSidebarProps) {
  return (
    <ResizableSidebar defaultWidth={320} minWidth={250} maxWidth={600} side="right">
      <AIModelSelector
        models={videoModels}
        selectedModel={selectedModel}
        description="Choose the best AI model for your video"
        onModelChange={onModelChange}
      />
      <AspectRatioSelector aspectRatio={aspectRatio} onAspectRatioChange={onAspectRatioChange} />
      <CameraMovementSelector
        cameraMovement={cameraMovement}
        onCameraMovementChange={onCameraMovementChange}
      />
    </ResizableSidebar>
  );
}

