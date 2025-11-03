-- Update set_edited_image_lineage_id trigger function to remove source_asset_id dependency
-- and rely solely on lineage_id passed in or derived from parent_id.

CREATE OR REPLACE FUNCTION set_edited_image_lineage_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If lineage_id was not provided but we have a parent_id, inherit from the parent edited image.
  IF NEW.lineage_id IS NULL AND NEW.parent_id IS NOT NULL THEN
    SELECT lineage_id
      INTO NEW.lineage_id
      FROM edited_images
     WHERE id = NEW.parent_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to ensure it uses the updated function definition.
DROP TRIGGER IF EXISTS trigger_set_edited_image_lineage_id ON edited_images;
CREATE TRIGGER trigger_set_edited_image_lineage_id
BEFORE INSERT ON edited_images
FOR EACH ROW EXECUTE FUNCTION set_edited_image_lineage_id();

