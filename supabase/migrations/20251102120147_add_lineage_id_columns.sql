-- Add lineage_id to media_assets (nullable initially, will be backfilled then made NOT NULL)
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS lineage_id uuid;

-- Add lineage_id to edited_images (nullable)
ALTER TABLE edited_images ADD COLUMN IF NOT EXISTS lineage_id uuid;

-- Add lineage_id to generated_videos (nullable)
ALTER TABLE generated_videos ADD COLUMN IF NOT EXISTS lineage_id uuid;

-- Add indexes (can be added before foreign keys)
CREATE INDEX IF NOT EXISTS idx_media_assets_lineage_id ON media_assets(lineage_id);
CREATE INDEX IF NOT EXISTS idx_edited_images_lineage_id ON edited_images(lineage_id);
CREATE INDEX IF NOT EXISTS idx_generated_videos_lineage_id ON generated_videos(lineage_id);
