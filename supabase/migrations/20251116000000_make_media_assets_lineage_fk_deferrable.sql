-- Make the media_assets.lineage_id foreign key constraint deferrable
-- This allows creating media assets and lineages in the correct order

-- Drop the existing constraint
ALTER TABLE media_assets DROP CONSTRAINT fk_media_assets_lineage_id;

-- Recreate it as deferrable
ALTER TABLE media_assets ADD CONSTRAINT fk_media_assets_lineage_id
FOREIGN KEY (lineage_id) REFERENCES lineages(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
