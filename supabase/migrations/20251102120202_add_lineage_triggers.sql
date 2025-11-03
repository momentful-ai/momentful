-- Trigger for edited_images: set lineage_id from parent_id if not already set
CREATE OR REPLACE FUNCTION set_edited_image_lineage_id() RETURNS TRIGGER AS $$
BEGIN
  -- If lineage_id is not already set and we have a parent_id, get it from parent
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
