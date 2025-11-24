-- 1) Extensions (local)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2) Tables

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  description text NULL,
  thumbnail_url text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lineages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id text NOT NULL,
  name text NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type = ANY(ARRAY['image','video'])),
  file_size bigint NOT NULL,
  storage_path text NOT NULL,
  thumbnail_url text NULL,
  width int NULL,
  height int NULL,
  duration numeric NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  lineage_id uuid NULL
);

CREATE TABLE IF NOT EXISTS public.edited_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id text NOT NULL,
  prompt text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  ai_model text NOT NULL,
  storage_path text NOT NULL,
  thumbnail_url text NULL,
  width int NOT NULL,
  height int NOT NULL,
  version int DEFAULT 1,
  parent_id uuid NULL,
  created_at timestamptz DEFAULT now(),
  lineage_id uuid NULL
);

CREATE TABLE IF NOT EXISTS public.generated_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id text NOT NULL,
  name text NOT NULL,
  ai_model text NOT NULL,
  aspect_ratio text NOT NULL CHECK (aspect_ratio = ANY(ARRAY['16:9','9:16','1:1','4:5'])),
  scene_type text NULL,
  camera_movement text NULL,
  storage_path text NULL,
  thumbnail_url text NULL,
  duration numeric NULL,
  status text DEFAULT 'processing' CHECK (status = ANY(ARRAY['processing','completed','failed'])),
  version int DEFAULT 1,
  parent_id uuid NULL,
  runway_task_id text NULL,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz NULL,
  lineage_id uuid NULL
);

CREATE TABLE IF NOT EXISTS public.video_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL,
  source_type text NOT NULL CHECK (source_type = ANY(ARRAY['edited_image','media_asset'])),
  source_id uuid NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  export_type text NOT NULL CHECK (export_type = ANY(ARRAY['video','image','batch'])),
  asset_ids jsonb DEFAULT '[]'::jsonb,
  format text NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  file_url text NULL,
  file_size bigint NULL,
  status text DEFAULT 'pending' CHECK (status = ANY(ARRAY['pending','processing','completed','failed'])),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz NULL
);

CREATE TABLE IF NOT EXISTS public.publish_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  asset_type text NOT NULL CHECK (asset_type = ANY(ARRAY['video','image'])),
  platform text NOT NULL,
  platform_url text NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'scheduled' CHECK (status = ANY(ARRAY['scheduled','published','failed'])),
  published_at timestamptz NULL,
  created_at timestamptz DEFAULT now()
);

-- 3) Foreign Keys

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lineages_project_id_fkey') THEN
    ALTER TABLE public.lineages
      ADD CONSTRAINT lineages_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'media_assets_project_id_fkey') THEN
    ALTER TABLE public.media_assets
      ADD CONSTRAINT media_assets_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname IN ('fk_media_assets_lineage_id','media_assets_lineage_id_fkey')
  ) THEN
    ALTER TABLE public.media_assets
      ADD CONSTRAINT fk_media_assets_lineage_id
      FOREIGN KEY (lineage_id) REFERENCES public.lineages(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'edited_images_project_id_fkey') THEN
    ALTER TABLE public.edited_images
      ADD CONSTRAINT edited_images_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'edited_images_parent_id_fkey') THEN
    ALTER TABLE public.edited_images
      ADD CONSTRAINT edited_images_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES public.edited_images(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_edited_images_lineage_id') THEN
    ALTER TABLE public.edited_images
      ADD CONSTRAINT fk_edited_images_lineage_id
      FOREIGN KEY (lineage_id) REFERENCES public.lineages(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'generated_videos_project_id_fkey') THEN
    ALTER TABLE public.generated_videos
      ADD CONSTRAINT generated_videos_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'generated_videos_parent_id_fkey') THEN
    ALTER TABLE public.generated_videos
      ADD CONSTRAINT generated_videos_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES public.generated_videos(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_generated_videos_lineage_id') THEN
    ALTER TABLE public.generated_videos
      ADD CONSTRAINT fk_generated_videos_lineage_id
      FOREIGN KEY (lineage_id) REFERENCES public.lineages(id) ON DELETE SET NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_sources_video_id_fkey') THEN
    ALTER TABLE public.video_sources
      ADD CONSTRAINT video_sources_video_id_fkey
      FOREIGN KEY (video_id) REFERENCES public.generated_videos(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exports_project_id_fkey') THEN
    ALTER TABLE public.exports
      ADD CONSTRAINT exports_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'publish_logs_project_id_fkey') THEN
    ALTER TABLE public.publish_logs
      ADD CONSTRAINT publish_logs_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 4) Indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_lineages_project_id ON public.lineages(project_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_project_id ON public.media_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_lineage_id ON public.media_assets(lineage_id);
CREATE INDEX IF NOT EXISTS idx_edited_images_project_id ON public.edited_images(project_id);
CREATE INDEX IF NOT EXISTS idx_edited_images_parent_id ON public.edited_images(parent_id);
CREATE INDEX IF NOT EXISTS idx_edited_images_lineage_id ON public.edited_images(lineage_id);
CREATE INDEX IF NOT EXISTS idx_generated_videos_project_id ON public.generated_videos(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_videos_parent_id ON public.generated_videos(parent_id);
CREATE INDEX IF NOT EXISTS idx_generated_videos_lineage_id ON public.generated_videos(lineage_id);
CREATE INDEX IF NOT EXISTS idx_video_sources_video_id ON public.video_sources(video_id);
CREATE INDEX IF NOT EXISTS idx_publish_logs_project_id ON public.publish_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_exports_project_id ON public.exports(project_id);

-- 5) RLS + Grants
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edited_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publish_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lineages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edited_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_videos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publish_logs TO authenticated;

-- Ownership policies
CREATE POLICY projects_owner_select ON public.projects
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

CREATE POLICY projects_owner_write ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = user_id);

CREATE POLICY projects_owner_update ON public.projects
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::text = user_id)
  WITH CHECK ((SELECT auth.uid())::text = user_id);

CREATE POLICY projects_owner_delete ON public.projects
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

CREATE POLICY lineages_owner_select ON public.lineages
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

CREATE POLICY lineages_owner_write ON public.lineages
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = user_id);

CREATE POLICY lineages_owner_update ON public.lineages
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::text = user_id)
  WITH CHECK ((SELECT auth.uid())::text = user_id);

CREATE POLICY lineages_owner_delete ON public.lineages
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

CREATE POLICY media_owner_select ON public.media_assets
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

CREATE POLICY media_owner_insert ON public.media_assets
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = user_id);

CREATE POLICY media_owner_update ON public.media_assets
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::text = user_id)
  WITH CHECK ((SELECT auth.uid())::text = user_id);

CREATE POLICY media_owner_delete ON public.media_assets
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

CREATE POLICY edited_images_owner_select ON public.edited_images
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

CREATE POLICY edited_images_owner_insert ON public.edited_images
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = user_id);

CREATE POLICY edited_images_owner_update ON public.edited_images
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::text = user_id)
  WITH CHECK ((SELECT auth.uid())::text = user_id);

CREATE POLICY edited_images_owner_delete ON public.edited_images
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

CREATE POLICY generated_videos_owner_select ON public.generated_videos
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

CREATE POLICY generated_videos_owner_insert ON public.generated_videos
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = user_id);

CREATE POLICY generated_videos_owner_update ON public.generated_videos
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::text = user_id)
  WITH CHECK ((SELECT auth.uid())::text = user_id);

CREATE POLICY generated_videos_owner_delete ON public.generated_videos
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

CREATE POLICY video_sources_parent_video_owner_select ON public.video_sources
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.generated_videos gv
      WHERE gv.id = video_id AND gv.user_id = (SELECT auth.uid())::text
    )
  );

CREATE POLICY video_sources_parent_video_owner_insert ON public.video_sources
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.generated_videos gv
      WHERE gv.id = video_id AND gv.user_id = (SELECT auth.uid())::text
    )
  );

CREATE POLICY video_sources_parent_video_owner_update ON public.video_sources
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.generated_videos gv
      WHERE gv.id = video_id AND gv.user_id = (SELECT auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.generated_videos gv
      WHERE gv.id = video_id AND gv.user_id = (SELECT auth.uid())::text
    )
  );

CREATE POLICY video_sources_parent_video_owner_delete ON public.video_sources
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.generated_videos gv
      WHERE gv.id = video_id AND gv.user_id = (SELECT auth.uid())::text
    )
  );

CREATE POLICY exports_owner_select ON public.exports
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY exports_owner_insert ON public.exports
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY exports_owner_update ON public.exports
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY exports_owner_delete ON public.exports
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY publish_logs_project_owner_select ON public.publish_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text
    )
  );

CREATE POLICY publish_logs_project_owner_insert ON public.publish_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text
    )
  );

CREATE POLICY publish_logs_project_owner_update ON public.publish_logs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text
    )
  );

CREATE POLICY publish_logs_project_owner_delete ON public.publish_logs
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text
    )
  );

-- 6) Trigger functions and triggers

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_projects_set_updated_at') THEN
    CREATE TRIGGER trg_projects_set_updated_at
      BEFORE UPDATE ON public.projects
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

CREATE OR REPLACE FUNCTION public.normalize_video_sources_sort_order()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.sort_order IS NULL THEN
    SELECT COALESCE(MAX(sort_order), -1) + 1
    INTO NEW.sort_order
    FROM public.video_sources
    WHERE video_id = NEW.video_id;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_video_sources_sort_order') THEN
    CREATE TRIGGER trg_video_sources_sort_order
      BEFORE INSERT ON public.video_sources
      FOR EACH ROW
      EXECUTE FUNCTION public.normalize_video_sources_sort_order();
  END IF;
END$$;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.normalize_video_sources_sort_order() FROM PUBLIC;

-- 7) Comments
COMMENT ON TABLE public.projects IS 'Projects owned by a user';
COMMENT ON TABLE public.lineages IS 'Lineage groups for assets/videos';
COMMENT ON TABLE public.media_assets IS 'Uploaded or stored media assets';
COMMENT ON TABLE public.edited_images IS 'Images created/edited by user';
COMMENT ON TABLE public.generated_videos IS 'Generated videos and their metadata';
COMMENT ON TABLE public.video_sources IS 'Video input sources linking to images/assets';
COMMENT ON TABLE public.exports IS 'Export jobs and results';
COMMENT ON TABLE public.publish_logs IS 'Publishing logs to external platforms';