-- Trigger for edited_images: set lineage_id from source_asset_id or parent_id
CREATE OR REPLACE FUNCTION set_edited_image_lineage_id() RETURNS TRIGGER AS $$
BEGIN
  -- Try to get from source_asset_id (media_assets)
  IF NEW.source_asset_id IS NOT NULL THEN
    SELECT lineage_id INTO NEW.lineage_id
    FROM media_assets
    WHERE id = NEW.source_asset_id;
  END IF;

  -- If no source_asset_id or not found, try parent_id (edited_images)
  IF NEW.lineage_id IS NULL AND NEW.parent_id IS NOT NULL THEN
    SELECT lineage_id INTO NEW.lineage_id
    FROM edited_images
    WHERE id = NEW.parent_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_edited_image_lineage_id ON edited_images;
CREATE TRIGGER trigger_set_edited_image_lineage_id
BEFORE INSERT ON edited_images
FOR EACH ROW EXECUTE FUNCTION set_edited_image_lineage_id();
