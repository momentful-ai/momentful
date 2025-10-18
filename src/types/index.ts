export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  project_id: string;
  user_id: string;
  file_name: string;
  file_type: 'image' | 'video';
  file_size: number;
  storage_path: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  duration?: number;
  sort_order: number;
  created_at: string;
}

export interface EditedImage {
  id: string;
  project_id: string;
  user_id: string;
  source_asset_id?: string;
  prompt: string;
  context: Record<string, any>;
  ai_model: string;
  storage_path: string;
  thumbnail_url?: string;
  width: number;
  height: number;
  version: number;
  parent_id?: string;
  created_at: string;
}

export interface GeneratedVideo {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  ai_model: string;
  aspect_ratio: '16:9' | '9:16' | '1:1' | '4:5';
  scene_type?: string;
  camera_movement?: string;
  storage_path?: string;
  thumbnail_url?: string;
  duration?: number;
  status: 'processing' | 'completed' | 'failed';
  version: number;
  parent_id?: string;
  created_at: string;
  completed_at?: string;
}

export interface VideoSource {
  id: string;
  video_id: string;
  source_type: 'edited_image' | 'media_asset';
  source_id: string;
  sort_order: number;
  created_at: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  type: 'image' | 'video';
  provider: string;
}
