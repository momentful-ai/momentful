import { MediaAsset, EditedImage } from '../../types';

export interface ImageEditorProps {
  asset: MediaAsset; // Always a MediaAsset (original or synthetic created from EditedImage)
  projectId: string;
  onClose: () => void;
  onSave: () => void;
  onNavigateToVideo?: (imageId: string) => void;
  onSelectImageToEdit?: (image: EditedImage) => void;
  sourceEditedImage?: EditedImage; // When editing an edited image, this is the image to use as source
}

export interface VersionHistoryItem {
  prompt: string;
  model: string;
  timestamp: string;
}

