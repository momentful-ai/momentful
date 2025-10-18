/*
  # Add Export and Publishing Features

  1. New Tables
    - `exports`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (uuid, not null)
      - `export_type` (text - 'video', 'image', 'batch')
      - `asset_ids` (jsonb - array of asset IDs included in export)
      - `format` (text - output format like 'mp4', 'jpg', 'png', 'zip')
      - `settings` (jsonb - export settings like quality, resolution)
      - `file_url` (text - URL to exported file)
      - `file_size` (bigint - size in bytes)
      - `status` (text - 'pending', 'processing', 'completed', 'failed')
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz)
    
    - `publish_logs`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (uuid, not null)
      - `asset_id` (uuid - ID of published asset)
      - `asset_type` (text - 'video', 'image')
      - `platform` (text - 'youtube', 'tiktok', 'instagram', 'facebook', etc)
      - `platform_url` (text - URL to published content)
      - `metadata` (jsonb - platform-specific metadata)
      - `status` (text - 'scheduled', 'published', 'failed')
      - `published_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own exports and publishes
*/

-- Create exports table
CREATE TABLE IF NOT EXISTS exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  export_type text NOT NULL CHECK (export_type IN ('video', 'image', 'batch')),
  asset_ids jsonb DEFAULT '[]'::jsonb,
  format text NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  file_url text,
  file_size bigint,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create publish_logs table
CREATE TABLE IF NOT EXISTS publish_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('video', 'image')),
  platform text NOT NULL,
  platform_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed')),
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_logs ENABLE ROW LEVEL SECURITY;

-- Exports policies
CREATE POLICY "Users can view own exports"
  ON exports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own exports"
  ON exports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own exports"
  ON exports FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own exports"
  ON exports FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Publish logs policies
CREATE POLICY "Users can view own publish logs"
  ON publish_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own publish logs"
  ON publish_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own publish logs"
  ON publish_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own publish logs"
  ON publish_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS exports_project_id_idx ON exports(project_id);
CREATE INDEX IF NOT EXISTS exports_user_id_idx ON exports(user_id);
CREATE INDEX IF NOT EXISTS exports_status_idx ON exports(status);
CREATE INDEX IF NOT EXISTS publish_logs_project_id_idx ON publish_logs(project_id);
CREATE INDEX IF NOT EXISTS publish_logs_user_id_idx ON publish_logs(user_id);
CREATE INDEX IF NOT EXISTS publish_logs_platform_idx ON publish_logs(platform);
