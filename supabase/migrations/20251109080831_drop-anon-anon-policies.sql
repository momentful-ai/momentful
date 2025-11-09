/*************************************************************
  # Remove anonymous development policies

  These policies were introduced to simplify local testing but
  allow the `anon` role to read and mutate every user's data.
  Once Clerk authentication is in place we must drop them to
  restore the default authenticated-only access pattern.
*************************************************************/

-- Projects
DROP POLICY IF EXISTS "Allow anon to view all projects" ON projects;
DROP POLICY IF EXISTS "Allow anon to create projects" ON projects;
DROP POLICY IF EXISTS "Allow anon to update all projects" ON projects;
DROP POLICY IF EXISTS "Allow anon to delete all projects" ON projects;

-- Media assets
DROP POLICY IF EXISTS "Allow anon to view all media assets" ON media_assets;
DROP POLICY IF EXISTS "Allow anon to create media assets" ON media_assets;
DROP POLICY IF EXISTS "Allow anon to update all media assets" ON media_assets;
DROP POLICY IF EXISTS "Allow anon to delete all media assets" ON media_assets;

-- Edited images
DROP POLICY IF EXISTS "Allow anon to view all edited images" ON edited_images;
DROP POLICY IF EXISTS "Allow anon to create edited images" ON edited_images;
DROP POLICY IF EXISTS "Allow anon to update all edited images" ON edited_images;
DROP POLICY IF EXISTS "Allow anon to delete all edited images" ON edited_images;

-- Generated videos
DROP POLICY IF EXISTS "Allow anon to view all generated videos" ON generated_videos;
DROP POLICY IF EXISTS "Allow anon to create generated videos" ON generated_videos;
DROP POLICY IF EXISTS "Allow anon to update all generated videos" ON generated_videos;
DROP POLICY IF EXISTS "Allow anon to delete all generated videos" ON generated_videos;

-- Video sources
DROP POLICY IF EXISTS "Allow anon to view all video sources" ON video_sources;
DROP POLICY IF EXISTS "Allow anon to create video sources" ON video_sources;
DROP POLICY IF EXISTS "Allow anon to delete all video sources" ON video_sources;

-- Lineages
DROP POLICY IF EXISTS "Allow anon to view all lineages" ON lineages;
DROP POLICY IF EXISTS "Allow anon to create lineages" ON lineages;
DROP POLICY IF EXISTS "Allow anon to update all lineages" ON lineages;
DROP POLICY IF EXISTS "Allow anon to delete all lineages" ON lineages;

-- Storage buckets
DROP POLICY IF EXISTS "Allow anon to upload to user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to read from user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to update in user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to delete from user-uploads" ON storage.objects;

DROP POLICY IF EXISTS "Allow anon to upload to edited-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to read from edited-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to update in edited-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to delete from edited-images" ON storage.objects;

DROP POLICY IF EXISTS "Allow anon to upload to generated-videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to read from generated-videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to update in generated-videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to delete from generated-videos" ON storage.objects;

DROP POLICY IF EXISTS "Allow anon to upload to thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to read from thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to update in thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to delete from thumbnails" ON storage.objects;

