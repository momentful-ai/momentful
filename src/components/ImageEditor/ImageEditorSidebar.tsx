import { ResizableSidebar } from '../shared/ResizableSidebar';
import { ImageEditorAspectRatioSelector } from './ImageEditorAspectRatioSelector';
import { VersionHistory } from './VersionHistory';
import { VersionHistoryItem } from './types';

interface ImageEditorSidebarProps {
  selectedRatio: string;
  versions: VersionHistoryItem[];
  onRatioChange: (ratio: string) => void;
}

export function ImageEditorSidebar({
  selectedRatio,
  versions,
  onRatioChange,
}: ImageEditorSidebarProps) {
  return (
    <ResizableSidebar defaultWidth={320} minWidth={250} maxWidth={600} side="right">
      <ImageEditorAspectRatioSelector selectedRatio={selectedRatio} onRatioChange={onRatioChange} />
      <VersionHistory versions={versions} />
    </ResizableSidebar>
  );
}

