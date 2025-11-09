BEGIN;

-- Recreate policies with proper casts (auth.uid() may be uuid; cast appropriately)

-- projects (user_id is text)
REVOKE ALL ON public.projects FROM PUBLIC;
DROP POLICY IF EXISTS projects_select_owner ON public.projects;
DROP POLICY IF EXISTS projects_insert_owner ON public.projects;
DROP POLICY IF EXISTS projects_update_owner ON public.projects;
DROP POLICY IF EXISTS projects_delete_owner ON public.projects;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_select_owner ON public.projects FOR SELECT TO authenticated USING ((SELECT auth.uid())::text = user_id);
CREATE POLICY projects_insert_owner ON public.projects FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid())::text = user_id);
CREATE POLICY projects_update_owner ON public.projects FOR UPDATE TO authenticated USING ((SELECT auth.uid())::text = user_id) WITH CHECK ((SELECT auth.uid())::text = user_id);
CREATE POLICY projects_delete_owner ON public.projects FOR DELETE TO authenticated USING ((SELECT auth.uid())::text = user_id);

-- lineages (project.user_id is text)
DROP POLICY IF EXISTS lineages_select_owner ON public.lineages;
DROP POLICY IF EXISTS lineages_insert_owner ON public.lineages;
DROP POLICY IF EXISTS lineages_update_owner ON public.lineages;
DROP POLICY IF EXISTS lineages_delete_owner ON public.lineages;
ALTER TABLE public.lineages ENABLE ROW LEVEL SECURITY;
CREATE POLICY lineages_select_owner ON public.lineages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY lineages_insert_owner ON public.lineages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY lineages_update_owner ON public.lineages FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY lineages_delete_owner ON public.lineages FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);

-- media_assets
DROP POLICY IF EXISTS media_assets_select_owner ON public.media_assets;
DROP POLICY IF EXISTS media_assets_insert_owner ON public.media_assets;
DROP POLICY IF EXISTS media_assets_update_owner ON public.media_assets;
DROP POLICY IF EXISTS media_assets_delete_owner ON public.media_assets;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY media_assets_select_owner ON public.media_assets FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY media_assets_insert_owner ON public.media_assets FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY media_assets_update_owner ON public.media_assets FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY media_assets_delete_owner ON public.media_assets FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);

-- edited_images
DROP POLICY IF EXISTS edited_images_select_owner ON public.edited_images;
DROP POLICY IF EXISTS edited_images_insert_owner ON public.edited_images;
DROP POLICY IF EXISTS edited_images_update_owner ON public.edited_images;
DROP POLICY IF EXISTS edited_images_delete_owner ON public.edited_images;
ALTER TABLE public.edited_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY edited_images_select_owner ON public.edited_images FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY edited_images_insert_owner ON public.edited_images FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY edited_images_update_owner ON public.edited_images FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY edited_images_delete_owner ON public.edited_images FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);

-- generated_videos
DROP POLICY IF EXISTS generated_videos_select_owner ON public.generated_videos;
DROP POLICY IF EXISTS generated_videos_insert_owner ON public.generated_videos;
DROP POLICY IF EXISTS generated_videos_update_owner ON public.generated_videos;
DROP POLICY IF EXISTS generated_videos_delete_owner ON public.generated_videos;
ALTER TABLE public.generated_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY generated_videos_select_owner ON public.generated_videos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY generated_videos_insert_owner ON public.generated_videos FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY generated_videos_update_owner ON public.generated_videos FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY generated_videos_delete_owner ON public.generated_videos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);

-- exports
DROP POLICY IF EXISTS exports_select_owner ON public.exports;
DROP POLICY IF EXISTS exports_insert_owner ON public.exports;
DROP POLICY IF EXISTS exports_update_owner ON public.exports;
DROP POLICY IF EXISTS exports_delete_owner ON public.exports;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY exports_select_owner ON public.exports FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY exports_insert_owner ON public.exports FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY exports_update_owner ON public.exports FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY exports_delete_owner ON public.exports FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);

-- publish_logs
DROP POLICY IF EXISTS publish_logs_select_owner ON public.publish_logs;
DROP POLICY IF EXISTS publish_logs_insert_owner ON public.publish_logs;
DROP POLICY IF EXISTS publish_logs_update_owner ON public.publish_logs;
DROP POLICY IF EXISTS publish_logs_delete_owner ON public.publish_logs;
ALTER TABLE public.publish_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY publish_logs_select_owner ON public.publish_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY publish_logs_insert_owner ON public.publish_logs FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY publish_logs_update_owner ON public.publish_logs FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY publish_logs_delete_owner ON public.publish_logs FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = (SELECT auth.uid())::text)
);

-- video_sources
DROP POLICY IF EXISTS video_sources_select_owner ON public.video_sources;
DROP POLICY IF EXISTS video_sources_insert_owner ON public.video_sources;
DROP POLICY IF EXISTS video_sources_update_owner ON public.video_sources;
DROP POLICY IF EXISTS video_sources_delete_owner ON public.video_sources;
ALTER TABLE public.video_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY video_sources_select_owner ON public.video_sources FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.generated_videos v JOIN public.projects p ON p.id = v.project_id WHERE v.id = video_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY video_sources_insert_owner ON public.video_sources FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.generated_videos v JOIN public.projects p ON p.id = v.project_id WHERE v.id = video_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY video_sources_update_owner ON public.video_sources FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.generated_videos v JOIN public.projects p ON p.id = v.project_id WHERE v.id = video_id AND p.user_id = (SELECT auth.uid())::text)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.generated_videos v JOIN public.projects p ON p.id = v.project_id WHERE v.id = video_id AND p.user_id = (SELECT auth.uid())::text)
);
CREATE POLICY video_sources_delete_owner ON public.video_sources FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.generated_videos v JOIN public.projects p ON p.id = v.project_id WHERE v.id = video_id AND p.user_id = (SELECT auth.uid())::text)
);

COMMIT;