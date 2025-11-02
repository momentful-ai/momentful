-- Create lineages table
CREATE TABLE IF NOT EXISTS lineages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  root_media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add unique constraint on root_media_asset_id
ALTER TABLE lineages ADD CONSTRAINT lineages_root_media_asset_id_unique UNIQUE (root_media_asset_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_lineages_project_id ON lineages(project_id);
CREATE INDEX IF NOT EXISTS idx_lineages_user_id ON lineages(user_id);

