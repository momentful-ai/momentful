import { ResizableSidebar } from '../shared/ResizableSidebar';
import { AIModelSelector } from '../shared/AIModelSelector';
import { ImageEditorAspectRatioSelector } from './ImageEditorAspectRatioSelector';
import { VersionHistory } from './VersionHistory';
import { imageModels } from '../../data/aiModels';
import { VersionHistoryItem } from './types';

interface ImageEditorSidebarProps {
  selectedModel: string;
  selectedRatio: string;
  versions: VersionHistoryItem[];
  onModelChange: (modelId: string) => void;
  onRatioChange: (ratio: string) => void;
}

export function ImageEditorSidebar({
  selectedModel,
  selectedRatio,
  versions,
  onModelChange,
  onRatioChange,
}: ImageEditorSidebarProps) {
  return (
    <ResizableSidebar defaultWidth={320} minWidth={250} maxWidth={600} side="right">
      <AIModelSelector
        models={imageModels}
        selectedModel={selectedModel}
        description="Choose the best AI model for your editing needs"
        onModelChange={onModelChange}
      />
      <ImageEditorAspectRatioSelector selectedRatio={selectedRatio} onRatioChange={onRatioChange} />
      <VersionHistory versions={versions} />
    </ResizableSidebar>
  );
}

