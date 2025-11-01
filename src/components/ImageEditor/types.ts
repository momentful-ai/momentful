import { MediaAsset } from '../../types';

export interface ImageEditorProps {
  asset: MediaAsset;
  projectId: string;
  onClose: () => void;
  onSave: () => void;
}

export interface VersionHistoryItem {
  prompt: string;
  model: string;
  timestamp: string;
}

