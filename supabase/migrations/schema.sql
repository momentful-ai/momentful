-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.edited_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id text NOT NULL,
  prompt text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  ai_model text NOT NULL,
  storage_path text NOT NULL,
  thumbnail_url text,
  width integer NOT NULL,
  height integer NOT NULL,
  version integer DEFAULT 1,
  parent_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  lineage_id uuid,
  CONSTRAINT edited_images_pkey PRIMARY KEY (id),
  CONSTRAINT edited_images_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT edited_images_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.edited_images(id),
  CONSTRAINT fk_edited_images_lineage_id FOREIGN KEY (lineage_id) REFERENCES public.lineages(id)
);
CREATE TABLE public.exports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  export_type text NOT NULL CHECK (export_type = ANY (ARRAY['video'::text, 'image'::text, 'batch'::text])),
  asset_ids jsonb DEFAULT '[]'::jsonb,
  format text NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  file_url text,
  file_size bigint,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT exports_pkey PRIMARY KEY (id),
  CONSTRAINT exports_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.generated_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id text NOT NULL,
  name text NOT NULL,
  ai_model text NOT NULL,
  aspect_ratio text NOT NULL CHECK (aspect_ratio = ANY (ARRAY['16:9'::text, '9:16'::text, '1:1'::text, '4:5'::text])),
  scene_type text,
  camera_movement text,
  storage_path text,
  thumbnail_url text,
  duration numeric,
  status text DEFAULT 'processing'::text CHECK (status = ANY (ARRAY['processing'::text, 'completed'::text, 'failed'::text])),
  version integer DEFAULT 1,
  parent_id uuid,
  runway_task_id text,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  lineage_id uuid,
  CONSTRAINT generated_videos_pkey PRIMARY KEY (id),
  CONSTRAINT generated_videos_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT generated_videos_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.generated_videos(id),
  CONSTRAINT fk_generated_videos_lineage_id FOREIGN KEY (lineage_id) REFERENCES public.lineages(id)
);
CREATE TABLE public.lineages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id text NOT NULL,
  root_media_asset_id uuid NOT NULL UNIQUE,
  name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lineages_pkey PRIMARY KEY (id),
  CONSTRAINT lineages_root_media_asset_id_fkey FOREIGN KEY (root_media_asset_id) REFERENCES public.media_assets(id),
  CONSTRAINT lineages_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.media_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type = ANY (ARRAY['image'::text, 'video'::text])),
  file_size bigint NOT NULL,
  storage_path text NOT NULL,
  thumbnail_url text,
  width integer,
  height integer,
  duration numeric,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  lineage_id uuid NOT NULL,
  CONSTRAINT media_assets_pkey PRIMARY KEY (id),
  CONSTRAINT media_assets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT fk_media_assets_lineage_id FOREIGN KEY (lineage_id) REFERENCES public.lineages(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  description text,
  thumbnail_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id)
);
CREATE TABLE public.publish_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  asset_type text NOT NULL CHECK (asset_type = ANY (ARRAY['video'::text, 'image'::text])),
  platform text NOT NULL,
  platform_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'scheduled'::text CHECK (status = ANY (ARRAY['scheduled'::text, 'published'::text, 'failed'::text])),
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT publish_logs_pkey PRIMARY KEY (id),
  CONSTRAINT publish_logs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.video_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL,
  source_type text NOT NULL CHECK (source_type = ANY (ARRAY['edited_image'::text, 'media_asset'::text])),
  source_id uuid NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT video_sources_pkey PRIMARY KEY (id),
  CONSTRAINT video_sources_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.generated_videos(id)
);