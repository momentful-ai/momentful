import { MediaAsset, EditedImage } from '../../types';

export interface ImageEditorProps {
  asset: MediaAsset;
  projectId: string;
  onClose: () => void;
  onSave: () => void;
  onNavigateToVideo?: (imageId: string) => void;
  onSelectImageToEdit?: (image: EditedImage) => void;
}

export interface VersionHistoryItem {
  prompt: string;
  model: string;
  timestamp: string;
}

