import { MediaAsset, EditedImage } from '../../types';
import { SelectedSource } from '../VideoGenerator/types';

export type MediaEditorMode = 'image-edit' | 'video-generate';

export interface UnifiedMediaEditorProps {
  // Mode and navigation
  initialMode: MediaEditorMode;
  projectId: string;
  onClose: () => void;
  onSave: () => void;

  // Image editing specific props
  asset?: MediaAsset; // For image editing mode
  sourceEditedImage?: EditedImage; // For image editing mode

  // Video generation specific props
  initialSelectedImageId?: string; // For video generation mode

  // Navigation callbacks
  onNavigateToVideo?: (imageId: string) => void;
  onSelectImageToEdit?: (image: EditedImage) => void;
}

// Combined state for both modes
export interface UnifiedEditorState {
  mode: MediaEditorMode;

  // Shared state
  selectedSources: SelectedSource[];

  // Image editing state
  productName: string;
  selectedRatio: string;
  isGenerating: boolean;
  showComparison: boolean;
  editedImageUrl: string | null;
  versions: VersionHistoryItem[];

  // Video generation state
  prompt: string;
  cameraMovement: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  selectedModel: string;
  generatedVideoUrl: string | null;
  videoError: boolean;
  isSelecting: boolean;
  selectionMode: 'add' | 'remove';
}

export interface VersionHistoryItem {
  prompt: string;
  model: string;
  timestamp: string;
}