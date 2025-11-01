-- Remove source_asset_id column from edited_images table
-- This column is no longer needed as the image URL is sufficient

-- Drop the index first
DROP INDEX IF EXISTS idx_edited_images_source_asset;

-- Drop the column
ALTER TABLE edited_images DROP COLUMN IF EXISTS source_asset_id;

