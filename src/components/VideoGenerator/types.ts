export interface SelectedSource {
  id: string;
  type: 'edited_image' | 'media_asset';
  thumbnail?: string;
  name: string;
}

export interface VideoGeneratorProps {
  projectId: string;
  onClose: () => void;
  onSave: () => void;
  initialSelectedImageId?: string;
}

