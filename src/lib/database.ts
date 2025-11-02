import { supabase } from './supabase';
import { TimelineNode, TimelineEdge } from '../types/timeline';

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

    async getById(assetId: string) {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error) throw error;
      return data;
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
      // Validate required fields
      if (!asset.project_id || !asset.project_id.trim()) {
        throw new Error('project_id is required and cannot be empty');
      }
      if (!asset.user_id || !asset.user_id.trim()) {
        throw new Error('user_id is required and cannot be empty');
      }

      // First, create the media_asset without lineage_id (will be set to NULL initially)
      const { data, error } = await supabase
        .from('media_assets')
        .insert(asset)
        .select()
        .single();

      if (error) throw error;

      // Now create the lineage with the actual root_media_asset_id
      const { data: lineageData, error: lineageError } = await supabase
        .from('lineages')
        .insert({
          project_id: asset.project_id,
          user_id: asset.user_id,
          root_media_asset_id: data.id,
          name: asset.file_name,
        })
        .select()
        .single();

      if (lineageError) throw lineageError;

      // Update the media_asset with the lineage_id
      const { data: updatedAsset, error: updateError } = await supabase
        .from('media_assets')
        .update({ lineage_id: lineageData.id })
        .eq('id', data.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return updatedAsset;
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

    async listBySourceAsset(sourceAssetId: string) {
      const { data, error } = await supabase
        .from('edited_images')
        .select('*')
        .eq('source_asset_id', sourceAssetId)
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
      prompt: string;
      context?: Record<string, unknown>;
      ai_model: string;
      storage_path: string;
      width: number;
      height: number;
      source_asset_id?: string;
      parent_id?: string;
    }) {
      // Validate required fields
      if (!image.project_id || !image.project_id.trim()) {
        throw new Error('project_id is required and cannot be empty');
      }
      if (!image.user_id || !image.user_id.trim()) {
        throw new Error('user_id is required and cannot be empty');
      }

      let lineage_id: string | undefined;

      // Lookup lineage_id from source
      if (image.source_asset_id) {
        const { data: sourceData, error: sourceError } = await supabase
          .from('media_assets')
          .select('lineage_id')
          .eq('id', image.source_asset_id)
          .single();

        if (sourceError) throw sourceError;
        lineage_id = sourceData?.lineage_id;
      } else if (image.parent_id) {
        const { data: parentData, error: parentError } = await supabase
          .from('edited_images')
          .select('lineage_id')
          .eq('id', image.parent_id)
          .single();

        if (parentError) throw parentError;
        lineage_id = parentData?.lineage_id;
      }

      const { data, error } = await supabase
        .from('edited_images')
        .insert({
          ...image,
          context: image.context || {},
          lineage_id,
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
      storage_path?: string;
      status?: 'processing' | 'completed' | 'failed';
      completed_at?: string;
      lineage_id?: string; // Optional, if not provided, will be set by trigger
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

  lineages: {
    async create(lineage: {
      project_id: string;
      user_id: string;
      root_media_asset_id: string;
      name?: string;
      metadata?: Record<string, unknown>;
    }) {
      const { data, error } = await supabase
        .from('lineages')
        .insert({
          project_id: lineage.project_id,
          user_id: lineage.user_id,
          root_media_asset_id: lineage.root_media_asset_id,
          name: lineage.name,
          metadata: lineage.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(lineageId: string, updates: {
      root_media_asset_id?: string;
      name?: string;
      metadata?: Record<string, unknown>;
    }) {
      const { data, error } = await supabase
        .from('lineages')
        .update(updates)
        .eq('id', lineageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async getByProject(projectId: string) {
      const { data, error } = await supabase
        .from('lineages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async getById(lineageId: string) {
      const { data, error } = await supabase
        .from('lineages')
        .select('*')
        .eq('id', lineageId)
        .single();

      if (error) throw error;
      return data;
    },

    async getByRootAsset(rootAssetId: string) {
      const { data, error } = await supabase
        .from('lineages')
        .select('*')
        .eq('root_media_asset_id', rootAssetId)
        .single();

      if (error) throw error;
      return data;
    },

    async getTimelineData(lineageId: string) {
      // Fetch all media_assets with this lineage_id
      const { data: mediaAssetsData, error: maError } = await supabase
        .from('media_assets')
        .select('*')
        .eq('lineage_id', lineageId);

      if (maError) throw maError;

      // Fetch all edited_images with this lineage_id
      const { data: editedImagesData, error: eiError } = await supabase
        .from('edited_images')
        .select('*')
        .eq('lineage_id', lineageId);

      if (eiError) throw eiError;

      // Fetch all generated_videos with this lineage_id
      const { data: generatedVideosData, error: gvError } = await supabase
        .from('generated_videos')
        .select('*')
        .eq('lineage_id', lineageId);

      if (gvError) throw gvError;

      // Transform to TimelineNode format with computed URLs
      const nodes: TimelineNode[] = [
        ...mediaAssetsData.map(data => ({
          type: 'media_asset' as const,
          data: {
            ...data,
            thumbnail_url: data.thumbnail_url || database.storage.getPublicUrl('user-uploads', data.storage_path),
          },
        } as TimelineNode)),
        ...editedImagesData.map(data => ({
          type: 'edited_image' as const,
          data: {
            ...data,
            edited_url: database.storage.getPublicUrl('user-uploads', data.storage_path),
          },
        } as TimelineNode)),
        ...generatedVideosData.map(data => ({
          type: 'generated_video' as const,
          data: {
            ...data,
            thumbnail_url: data.thumbnail_url || (data.storage_path ? database.storage.getPublicUrl('user-uploads', data.storage_path) : undefined),
          },
        } as TimelineNode)),
      ];

      // Build edges
      const edges: TimelineEdge[] = [];

      // Edges from edited_images source_asset_id or parent_id
      for (const ei of editedImagesData) {
        if (ei.source_asset_id) {
          edges.push({ from: ei.source_asset_id, to: ei.id });
        } else if (ei.parent_id) {
          edges.push({ from: ei.parent_id, to: ei.id });
        }
      }

      // Edges from video_sources to generated_videos
      for (const gv of generatedVideosData) {
        const { data: sources, error: vsError } = await supabase
          .from('video_sources')
          .select('source_id')
          .eq('video_id', gv.id);

        if (vsError) throw vsError;

        for (const source of sources) {
          edges.push({ from: source.source_id, to: gv.id });
        }
      }

      // Sort nodes by created_at
      nodes.sort((a, b) => new Date(a.data.created_at).getTime() - new Date(b.data.created_at).getTime());

      return { nodes, edges };
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
