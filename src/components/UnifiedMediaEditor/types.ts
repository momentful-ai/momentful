import { MediaAsset, EditedImage } from '../../types';

export type MediaEditorMode = 'image-edit' | 'video-generate';

export interface SelectedSource {
  id: string;
  type: 'edited_image' | 'media_asset' | 'generated_video';
  thumbnail?: string;
  storagePath?: string;
  name: string;
}

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
  selectedImageForPreview: { id: string; url: string; storagePath?: string; fileName: string; type: 'edited_image' | 'media_asset' | 'generated_video' } | null;

  // Video generation state
  prompt: string;
  cameraMovement: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  duration: number;
  generatedVideoUrl: string | null;
  videoError: boolean;
  isSelecting: boolean;
  selectionMode: 'add' | 'remove';
}