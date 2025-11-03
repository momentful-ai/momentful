-- Fix the trigger to properly set lineage_id in BEFORE INSERT
-- The key is that we can modify NEW.lineage_id in BEFORE INSERT

CREATE OR REPLACE FUNCTION create_media_asset_with_lineage()
RETURNS TRIGGER AS $$
DECLARE
  new_lineage_id uuid;
BEGIN
  -- Generate new lineage ID
  new_lineage_id := gen_random_uuid();
  
  -- Set lineage_id on the media asset BEFORE insert
  NEW.lineage_id := new_lineage_id;

  -- Create lineage record AFTER setting the lineage_id
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
