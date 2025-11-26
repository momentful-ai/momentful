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
  prompt: string;
  context: Record<string, unknown>;
  ai_model: string;
  storage_path: string;
  thumbnail_url: string | null;
  edited_url: string;
  width: number;
  height: number;
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
  runway_task_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export const database = {
  projects: {
    async list(userId: string) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const projectsWithMedia = await Promise.all(
        (data || []).map(async (project) => {
          const { data: mediaAssets } = await supabase
            .from('media_assets')
            .select('storage_path')
            .eq('project_id', project.id)
            .eq('user_id', userId)
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

    async update(projectId: string, userId: string, updates: { name?: string; description?: string }) {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(projectId: string, userId: string) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) throw error;
    },
  },

  mediaAssets: {
    async list(projectId: string, userId: string) {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async getById(assetId: string, userId: string) {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .eq('id', assetId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    },

    async create(asset: {
      project_id: string;
      user_id: string;
      file_name: string;
      file_size: number;
      storage_path: string;
      width?: number;
      height?: number;
      duration?: number;
      file_type?: 'image' | 'video';
    }) {
      // Validate required fields
      if (!asset.project_id || !asset.project_id.trim()) {
        throw new Error('project_id is required and cannot be empty');
      }
      if (!asset.user_id || !asset.user_id.trim()) {
        throw new Error('user_id is required and cannot be empty');
      }

      const { data, error } = await supabase
        .from('media_assets')
        .insert(asset)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(assetId: string, userId: string) {
      const { error } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', assetId)
        .eq('user_id', userId);

      if (error) throw error;
    },
  },

  editedImages: {
    async list(projectId: string, userId: string) {
      const { data, error } = await supabase
        .from('edited_images')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async create(image: {
      project_id: string;
      user_id: string;
      prompt: string;
      context?: Record<string, unknown>;
      ai_model: string;
      storage_path: string;
      width: number;
      height: number;
    }) {
      // Validate required fields
      if (!image.project_id || !image.project_id.trim()) {
        throw new Error('project_id is required and cannot be empty');
      }
      if (!image.user_id || !image.user_id.trim()) {
        throw new Error('user_id is required and cannot be empty');
      }

      const { data, error } = await supabase
        .from('edited_images')
        .insert({
          ...image,
          context: image.context || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(imageId: string, userId: string) {
      const { error } = await supabase
        .from('edited_images')
        .delete()
        .eq('id', imageId)
        .eq('user_id', userId);

      if (error) throw error;
    },
  },

  generatedVideos: {
    async list(projectId: string, userId: string) {
      const { data, error } = await supabase
        .from('generated_videos')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
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
      storage_path?: string;
      status?: 'processing' | 'completed' | 'failed';
      completed_at?: string;
    }) {
      // Validate required fields
      if (!video.project_id || !video.project_id.trim()) {
        throw new Error('project_id is required and cannot be empty');
      }
      if (!video.user_id || !video.user_id.trim()) {
        throw new Error('user_id is required and cannot be empty');
      }

      const { data, error } = await supabase
        .from('generated_videos')
        .insert(video)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(videoId: string, userId: string, updates: {
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
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(videoId: string, userId: string) {
      const { error } = await supabase
        .from('generated_videos')
        .delete()
        .eq('id', videoId)
        .eq('user_id', userId);

      if (error) throw error;
    },
  },

  videoSources: {
    async list(videoId: string, userId: string) {
      // First check if the video belongs to the user
      const { data: videoCheck, error: videoError } = await supabase
        .from('generated_videos')
        .select('id')
        .eq('id', videoId)
        .eq('user_id', userId)
        .single();

      if (videoError || !videoCheck) {
        throw new Error('Video not found or access denied');
      }

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
      source_type: 'edited_image' | 'media_asset' | 'generated_video';
      source_id: string;
      sort_order?: number;
    }, userId: string) {
      // First check if the video belongs to the user
      const { data: videoCheck, error: videoError } = await supabase
        .from('generated_videos')
        .select('id')
        .eq('id', source.video_id)
        .eq('user_id', userId)
        .single();

      if (videoError || !videoCheck) {
        throw new Error('Video not found or access denied');
      }

      const { data, error } = await supabase
        .from('video_sources')
        .insert(source)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(sourceId: string, userId: string) {
      // First get the video_id from the source
      const { data: sourceData, error: sourceError } = await supabase
        .from('video_sources')
        .select('video_id')
        .eq('id', sourceId)
        .single();

      if (sourceError || !sourceData) {
        throw new Error('Video source not found');
      }

      // Check if the video belongs to the user
      const { data: videoCheck, error: videoError } = await supabase
        .from('generated_videos')
        .select('id')
        .eq('id', sourceData.video_id)
        .eq('user_id', userId)
        .single();

      if (videoError || !videoCheck) {
        throw new Error('Video not found or access denied');
      }

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

    /**
     * Get a signed URL for secure access to private storage objects
     * This method uses the signed URL API endpoint for proper authentication
     */
    async getSignedUrl(bucket: string, path: string, expiresIn?: number) {
      // Import the signed URL utility dynamically to avoid circular dependencies
      const { getSignedUrl } = await import('./storage-utils');

      const result = await getSignedUrl(bucket, path, expiresIn);

      if (!result.success) {
        throw new Error(result.error || 'Failed to get signed URL');
      }

      return result.signedUrl!;
    },
  },
};
