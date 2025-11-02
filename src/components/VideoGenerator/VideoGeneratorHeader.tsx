import { EditorHeader } from '../shared/EditorHeader';

interface VideoGeneratorHeaderProps {
  onClose: () => void;
}

export function VideoGeneratorHeader({ onClose }: VideoGeneratorHeaderProps) {
  return <EditorHeader title="Video Generator" onClose={onClose} closeLabel="Close" />;
}

