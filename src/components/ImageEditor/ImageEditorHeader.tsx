import { EditorHeader } from '../shared/EditorHeader';

interface ImageEditorHeaderProps {
  onClose: () => void;
}

export function ImageEditorHeader({ onClose }: ImageEditorHeaderProps) {
  return <EditorHeader title="Image Editor" onClose={onClose} />;
}

