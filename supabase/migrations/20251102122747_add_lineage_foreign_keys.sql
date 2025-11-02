-- Make media_assets.lineage_id NOT NULL (after backfill ensures all have values)
ALTER TABLE media_assets ALTER COLUMN lineage_id SET NOT NULL;

-- Add foreign key constraints (now safe since lineages exist and lineage_ids are set)
ALTER TABLE media_assets ADD CONSTRAINT fk_media_assets_lineage_id FOREIGN KEY (lineage_id) REFERENCES lineages(id) ON DELETE SET NULL;
ALTER TABLE edited_images ADD CONSTRAINT fk_edited_images_lineage_id FOREIGN KEY (lineage_id) REFERENCES lineages(id) ON DELETE SET NULL;
ALTER TABLE generated_videos ADD CONSTRAINT fk_generated_videos_lineage_id FOREIGN KEY (lineage_id) REFERENCES lineages(id) ON DELETE SET NULL;


