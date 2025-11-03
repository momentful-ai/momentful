-- Fix the foreign key constraint to be deferrable so it can be checked at transaction end
-- This allows the lineage to reference the media asset even if it's created in the same transaction

-- Drop the existing constraint
ALTER TABLE lineages DROP CONSTRAINT lineages_root_media_asset_id_fkey;

-- Recreate it as deferrable
ALTER TABLE lineages ADD CONSTRAINT lineages_root_media_asset_id_fkey 
FOREIGN KEY (root_media_asset_id) REFERENCES media_assets(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Update the trigger function to use BEFORE INSERT again
CREATE OR REPLACE FUNCTION create_media_asset_with_lineage()
RETURNS TRIGGER AS $$
DECLARE
  new_lineage_id uuid;
BEGIN
  -- Generate new lineage ID
  new_lineage_id := gen_random_uuid();
  
  -- Set lineage_id on the media asset BEFORE insert
  NEW.lineage_id := new_lineage_id;

  -- Create lineage record (foreign key check deferred until end of transaction)
  INSERT INTO lineages (id, project_id, user_id, root_media_asset_id, name)
  VALUES (new_lineage_id, NEW.project_id, NEW.user_id, NEW.id, NEW.file_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger as BEFORE INSERT
DROP TRIGGER IF EXISTS trigger_create_media_asset_lineage ON media_assets;
CREATE TRIGGER trigger_create_media_asset_lineage
BEFORE INSERT ON media_assets
FOR EACH ROW EXECUTE FUNCTION create_media_asset_with_lineage();
