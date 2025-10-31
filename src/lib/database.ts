import { supabase } from './supabase';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  previewImages?: string[];
}

export interface EditedImage {
  id: string;
  project_id: string;
  user_id: string;
  source_asset_id: string | null;
  prompt: string;
  context: Record<string, unknown>;
  ai_model: string;
  storage_path: string;
  thumbnail_url: string | null;
  edited_url: string;
  width: number;
  height: number;
  version: number;
  parent_id: string | null;
  created_at: string;
}

export interface GeneratedVideo {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  ai_model: string;
  aspect_ratio: string;
  scene_type: string | null;
  camera_movement: string | null;
  storage_path: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  status: 'processing' | 'completed' | 'failed';
  version: number;
  parent_id: string | null;
  runway_task_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export const database = {
  projects: {
    async list() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const projectsWithMedia = await Promise.all(
        (data || []).map(async (project) => {
          const { data: mediaAssets } = await supabase
            .from('media_assets')
            .select('storage_path')
            .eq('project_id', project.id)
            .eq('file_type', 'image')
            .order('created_at', { ascending: false })
            .limit(4);

          return {
            ...project,
            previewImages: mediaAssets?.map(asset => asset.storage_path) || []
          };
        })
      );

      return projectsWithMedia;
    },

    async create(userId: string, name: string, description?: string) {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name,
          description: description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(projectId: string, updates: { name?: string; description?: string }) {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(projectId: string) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    },
  },

  mediaAssets: {
    async list(projectId: string) {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async create(asset: {
      project_id: string;
      user_id: string;
      file_name: string;
      file_type: 'image' | 'video';
      file_size: number;
      storage_path: string;
      width?: number;
      height?: number;
      duration?: number;
    }) {
      const { data, error } = await supabase
        .from('media_assets')
        .insert(asset)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(assetId: string) {
      const { error } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
    },
  },

  editedImages: {
    async list(projectId: string) {
      const { data, error } = await supabase
        .from('edited_images')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row) => ({
        ...row,
        edited_url: database.storage.getPublicUrl('user-uploads', row.storage_path),
      }));
    },

    async create(image: {
      project_id: string;
      user_id: string;
      source_asset_id?: string;
      prompt: string;
      context?: Record<string, unknown>;
      ai_model: string;
      storage_path: string;
      width: number;
      height: number;
    }) {
      const { data, error } = await supabase
        .from('edited_images')
        .insert({
          ...image,
          context: image.context || {},
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        edited_url: database.storage.getPublicUrl('user-uploads', data.storage_path),
      };
    },

    async delete(imageId: string) {
      const { error } = await supabase
        .from('edited_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
    },
  },

  generatedVideos: {
    async list(projectId: string) {
      const { data, error } = await supabase
        .from('generated_videos')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async create(video: {
      project_id: string;
      user_id: string;
      name: string;
      ai_model: string;
      aspect_ratio: string;
      scene_type?: string;
      camera_movement?: string;
      runway_task_id?: string;
      video_url?: string;
      storage_path?: string;
      status?: 'processing' | 'completed' | 'failed';
      completed_at?: string;
    }) {
      const { data, error } = await supabase
        .from('generated_videos')
        .insert(video)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(videoId: string, updates: {
      storage_path?: string;
      thumbnail_url?: string;
      duration?: number;
      status?: 'processing' | 'completed' | 'failed';
      completed_at?: string;
      runway_task_id?: string;
      name?: string;
      ai_model?: string;
      aspect_ratio?: string;
      scene_type?: string;
      camera_movement?: string;
    }) {
      const { data, error } = await supabase
        .from('generated_videos')
        .update(updates)
        .eq('id', videoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(videoId: string) {
      const { error } = await supabase
        .from('generated_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
    },
  },

  videoSources: {
    async list(videoId: string) {
      const { data, error } = await supabase
        .from('video_sources')
        .select('*')
        .eq('video_id', videoId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async create(source: {
      video_id: string;
      source_type: 'edited_image' | 'media_asset';
      source_id: string;
      sort_order?: number;
    }) {
      const { data, error } = await supabase
        .from('video_sources')
        .insert(source)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(sourceId: string) {
      const { error } = await supabase
        .from('video_sources')
        .delete()
        .eq('id', sourceId);

      if (error) throw error;
    },
  },

  storage: {
    async upload(bucket: string, path: string, file: File) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;
      return data;
    },

    async delete(bucket: string, paths: string[]) {
      const { error } = await supabase.storage
        .from(bucket)
        .remove(paths);

      if (error) throw error;
    },

    getPublicUrl(bucket: string, path: string) {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      return data.publicUrl;
    },
  },
};
