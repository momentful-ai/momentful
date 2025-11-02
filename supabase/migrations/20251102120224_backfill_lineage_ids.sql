-- Backfill lineage_id for existing media_assets
DO $$
DECLARE
  asset RECORD;
  new_lineage_id uuid;
BEGIN
  FOR asset IN SELECT id, project_id, user_id, file_name FROM media_assets WHERE lineage_id IS NULL LOOP
    new_lineage_id := gen_random_uuid();
    
    -- Create lineage record
    INSERT INTO lineages (id, project_id, user_id, root_media_asset_id, name)
    VALUES (new_lineage_id, asset.project_id, asset.user_id, asset.id, asset.file_name);
    
    -- Update media_asset
    UPDATE media_assets
    SET lineage_id = new_lineage_id
    WHERE id = asset.id;
  END LOOP;
END $$;

-- Backfill lineage_id for existing edited_images
UPDATE edited_images e
SET lineage_id = m.lineage_id
FROM media_assets m
WHERE e.source_asset_id = m.id
AND e.lineage_id IS NULL;

-- Backfill lineage_id for existing generated_videos
-- Use DISTINCT ON to get the first source per video (preferring edited_image)
UPDATE generated_videos v
SET lineage_id = source_lineage.lineage_id
FROM (
  SELECT DISTINCT ON (vs.video_id)
    vs.video_id,
    COALESCE(e.lineage_id, m.lineage_id) as lineage_id
  FROM video_sources vs
  LEFT JOIN edited_images e ON vs.source_type = 'edited_image' AND vs.source_id = e.id
  LEFT JOIN media_assets m ON vs.source_type = 'media_asset' AND vs.source_id = m.id
  WHERE COALESCE(e.lineage_id, m.lineage_id) IS NOT NULL
  ORDER BY vs.video_id, CASE WHEN vs.source_type = 'edited_image' THEN 0 ELSE 1 END, vs.sort_order ASC
) source_lineage
WHERE v.id = source_lineage.video_id
AND v.lineage_id IS NULL;
