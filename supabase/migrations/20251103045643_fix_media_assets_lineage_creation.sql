-- Create function to handle media asset lineage creation
CREATE OR REPLACE FUNCTION create_media_asset_with_lineage()
RETURNS TRIGGER AS $$
DECLARE
  new_lineage_id uuid;
BEGIN
  -- Generate new lineage ID
  new_lineage_id := gen_random_uuid();

  -- Create lineage record
  INSERT INTO lineages (id, project_id, user_id, root_media_asset_id, name)
  VALUES (new_lineage_id, NEW.project_id, NEW.user_id, NEW.id, NEW.file_name);

  -- Set lineage_id on the media asset
  NEW.lineage_id := new_lineage_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create lineage for new media assets
DROP TRIGGER IF EXISTS trigger_create_media_asset_lineage ON media_assets;
CREATE TRIGGER trigger_create_media_asset_lineage
BEFORE INSERT ON media_assets
FOR EACH ROW EXECUTE FUNCTION create_media_asset_with_lineage();
