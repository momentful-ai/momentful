/*
  # Initial Schema for AI Marketing Visuals Platform

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `user_id` (text, references Clerk user ID)
      - `name` (text)
      - `description` (text, nullable)
      - `thumbnail_url` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `media_assets`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (text, references Clerk user ID)
      - `file_name` (text)
      - `file_type` (text) - 'image' or 'video'
      - `file_size` (bigint)
      - `storage_path` (text)
      - `thumbnail_url` (text, nullable)
      - `width` (integer, nullable)
      - `height` (integer, nullable)
      - `duration` (numeric, nullable) - for videos in seconds
      - `sort_order` (integer, default 0)
      - `created_at` (timestamptz)
    
    - `edited_images`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (text, references Clerk user ID)
      - `source_asset_id` (uuid, nullable, foreign key to media_assets)
      - `prompt` (text)
      - `context` (jsonb) - stores additional context for editing
      - `ai_model` (text) - model used for generation
      - `storage_path` (text)
      - `thumbnail_url` (text, nullable)
      - `width` (integer)
      - `height` (integer)
      - `version` (integer, default 1)
      - `parent_id` (uuid, nullable, foreign key to edited_images) - for version history
      - `created_at` (timestamptz)
    
    - `generated_videos`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (text, references Clerk user ID)
      - `name` (text)
      - `ai_model` (text)
      - `aspect_ratio` (text) - '16:9', '9:16', '1:1', '4:5'
      - `scene_type` (text, nullable)
      - `camera_movement` (text, nullable)
      - `storage_path` (text, nullable)
      - `thumbnail_url` (text, nullable)
      - `duration` (numeric, nullable)
      - `status` (text, default 'processing') - 'processing', 'completed', 'failed'
      - `version` (integer, default 1)
      - `parent_id` (uuid, nullable, foreign key to generated_videos)
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)
    
    - `video_sources`
      - `id` (uuid, primary key)
      - `video_id` (uuid, foreign key to generated_videos)
      - `source_type` (text) - 'edited_image', 'media_asset'
      - `source_id` (uuid) - references either edited_images or media_assets
      - `sort_order` (integer, default 0)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    
  3. Indexes
    - Add indexes on foreign keys and frequently queried columns for performance
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  description text,
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create media_assets table
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'video')),
  file_size bigint NOT NULL,
  storage_path text NOT NULL,
  thumbnail_url text,
  width integer,
  height integer,
  duration numeric,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create edited_images table
CREATE TABLE IF NOT EXISTS edited_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  source_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  prompt text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  ai_model text NOT NULL,
  storage_path text NOT NULL,
  thumbnail_url text,
  width integer NOT NULL,
  height integer NOT NULL,
  version integer DEFAULT 1,
  parent_id uuid REFERENCES edited_images(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create generated_videos table
CREATE TABLE IF NOT EXISTS generated_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  name text NOT NULL,
  ai_model text NOT NULL,
  aspect_ratio text NOT NULL CHECK (aspect_ratio IN ('16:9', '9:16', '1:1', '4:5')),
  scene_type text,
  camera_movement text,
  storage_path text,
  thumbnail_url text,
  duration numeric,
  status text DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  version integer DEFAULT 1,
  parent_id uuid REFERENCES generated_videos(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create video_sources table
CREATE TABLE IF NOT EXISTS video_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES generated_videos(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('edited_image', 'media_asset')),
  source_id uuid NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE edited_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_sources ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.jwt()->>'sub')
  WITH CHECK (user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (user_id = auth.jwt()->>'sub');

-- Media assets policies
CREATE POLICY "Users can view own media assets"
  ON media_assets FOR SELECT
  TO authenticated
  USING (user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can create own media assets"
  ON media_assets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can update own media assets"
  ON media_assets FOR UPDATE
  TO authenticated
  USING (user_id = auth.jwt()->>'sub')
  WITH CHECK (user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can delete own media assets"
  ON media_assets FOR DELETE
  TO authenticated
  USING (user_id = auth.jwt()->>'sub');

-- Edited images policies
CREATE POLICY "Users can view own edited images"
  ON edited_images FOR SELECT
  TO authenticated
  USING (user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can create own edited images"
  ON edited_images FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can update own edited images"
  ON edited_images FOR UPDATE
  TO authenticated
  USING (user_id = auth.jwt()->>'sub')
  WITH CHECK (user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can delete own edited images"
  ON edited_images FOR DELETE
  TO authenticated
  USING (user_id = auth.jwt()->>'sub');

-- Generated videos policies
CREATE POLICY "Users can view own generated videos"
  ON generated_videos FOR SELECT
  TO authenticated
  USING (user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can create own generated videos"
  ON generated_videos FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can update own generated videos"
  ON generated_videos FOR UPDATE
  TO authenticated
  USING (user_id = auth.jwt()->>'sub')
  WITH CHECK (user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can delete own generated videos"
  ON generated_videos FOR DELETE
  TO authenticated
  USING (user_id = auth.jwt()->>'sub');

-- Video sources policies
CREATE POLICY "Users can view own video sources"
  ON video_sources FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM generated_videos
      WHERE generated_videos.id = video_sources.video_id
      AND generated_videos.user_id = auth.jwt()->>'sub'
    )
  );

CREATE POLICY "Users can create own video sources"
  ON video_sources FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM generated_videos
      WHERE generated_videos.id = video_sources.video_id
      AND generated_videos.user_id = auth.jwt()->>'sub'
    )
  );

CREATE POLICY "Users can delete own video sources"
  ON video_sources FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM generated_videos
      WHERE generated_videos.id = video_sources.video_id
      AND generated_videos.user_id = auth.jwt()->>'sub'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_assets_project_id ON media_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_sort_order ON media_assets(project_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_edited_images_project_id ON edited_images(project_id);
CREATE INDEX IF NOT EXISTS idx_edited_images_user_id ON edited_images(user_id);
CREATE INDEX IF NOT EXISTS idx_edited_images_source_asset ON edited_images(source_asset_id);
CREATE INDEX IF NOT EXISTS idx_edited_images_parent_id ON edited_images(parent_id);

CREATE INDEX IF NOT EXISTS idx_generated_videos_project_id ON generated_videos(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_videos_user_id ON generated_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_videos_status ON generated_videos(status);
CREATE INDEX IF NOT EXISTS idx_generated_videos_parent_id ON generated_videos(parent_id);

CREATE INDEX IF NOT EXISTS idx_video_sources_video_id ON video_sources(video_id);
CREATE INDEX IF NOT EXISTS idx_video_sources_sort_order ON video_sources(video_id, sort_order);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for projects table
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();