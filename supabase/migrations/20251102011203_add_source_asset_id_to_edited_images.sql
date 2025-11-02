-- Add source_asset_id column to edited_images table
-- This enables tracking which original MediaAsset an edited image came from
-- for displaying editing history

-- Add the column
ALTER TABLE edited_images 
ADD COLUMN IF NOT EXISTS source_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL;

-- Add index for query performance
CREATE INDEX IF NOT EXISTS idx_edited_images_source_asset ON edited_images(source_asset_id);


