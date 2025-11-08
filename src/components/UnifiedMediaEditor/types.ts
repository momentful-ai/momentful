import { MediaAsset, EditedImage } from '../../types';

export type EditorMode = 'image' | 'video';

export interface UnifiedMediaEditorProps {
  // Common props
  projectId: string;
  onClose: () => void;
  onSave: () => void;

  // Image editing mode props
  asset?: MediaAsset;
  sourceEditedImage?: EditedImage;
  onNavigateToVideo?: (imageId: string) => void;
  onSelectImageToEdit?: (image: EditedImage) => void;

  // Video generation mode props
  initialSelectedImageId?: string;

  // Mode control
  initialMode?: EditorMode;
}

export interface ModeTransitionProps {
  currentMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

export interface SharedState {
  // State that should persist across mode switches
  selectedImages: string[]; // IDs of selected images for video generation
  prompt: string; // Current prompt text
}