import { ResizableSidebar } from '../shared/ResizableSidebar';
import { AIModelSelector } from '../shared/AIModelSelector';
import { AspectRatioSelector } from './AspectRatioSelector';
import { SceneTypeSelector } from './SceneTypeSelector';
import { CameraMovementSelector } from './CameraMovementSelector';
import { videoModels } from '../../data/aiModels';

interface VideoGeneratorSidebarProps {
  selectedModel: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  sceneType: string;
  cameraMovement: string;
  onModelChange: (modelId: string) => void;
  onAspectRatioChange: (ratio: '16:9' | '9:16' | '1:1' | '4:5') => void;
  onSceneTypeChange: (sceneType: string) => void;
  onCameraMovementChange: (movement: string) => void;
}

export function VideoGeneratorSidebar({
  selectedModel,
  aspectRatio,
  sceneType,
  cameraMovement,
  onModelChange,
  onAspectRatioChange,
  onSceneTypeChange,
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
      <SceneTypeSelector sceneType={sceneType} onSceneTypeChange={onSceneTypeChange} />
      <CameraMovementSelector
        cameraMovement={cameraMovement}
        onCameraMovementChange={onCameraMovementChange}
      />
    </ResizableSidebar>
  );
}

