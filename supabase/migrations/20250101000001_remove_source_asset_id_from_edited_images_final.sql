-- Remove source_asset_id column from edited_images table
-- This column is no longer needed as lineage_id provides the relationship to the root asset

-- Drop the foreign key constraint first
ALTER TABLE edited_images DROP CONSTRAINT IF EXISTS edited_images_source_asset_id_fkey;

-- Drop the index
DROP INDEX IF EXISTS idx_edited_images_source_asset;

-- Drop the column
ALTER TABLE edited_images DROP COLUMN IF EXISTS source_asset_id;
