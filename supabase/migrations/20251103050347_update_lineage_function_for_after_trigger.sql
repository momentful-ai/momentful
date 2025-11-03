-- Update the trigger function to work with AFTER INSERT
-- Since we can't modify NEW in AFTER triggers, we need to update the media asset after creating the lineage

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

  -- Update the media asset to set the lineage_id (this works in AFTER INSERT)
  UPDATE media_assets SET lineage_id = new_lineage_id WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
