-- Fix trigger to run AFTER INSERT instead of BEFORE INSERT
-- This ensures the media asset exists before creating the lineage

-- Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_create_media_asset_lineage ON media_assets;

-- Recreate the trigger to run AFTER INSERT
CREATE TRIGGER trigger_create_media_asset_lineage
AFTER INSERT ON media_assets
FOR EACH ROW EXECUTE FUNCTION create_media_asset_with_lineage();
