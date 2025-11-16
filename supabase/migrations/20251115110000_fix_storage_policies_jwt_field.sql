-- Fix storage policies to use 'user_id' instead of 'sub' from Clerk JWT
-- Clerk JWT template puts user ID in 'user_id' field, not 'sub'

BEGIN;

-- Drop existing authenticated storage policies
DROP POLICY IF EXISTS "Users can upload to own folder in user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files in user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in user-uploads" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload to own folder in edited-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files in edited-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in edited-images" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload to own folder in generated-videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files in generated-videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in generated-videos" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload to own folder in thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files in thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in thumbnails" ON storage.objects;

-- Recreate storage policies using 'user_id' from JWT
-- Storage policies for user-uploads bucket
CREATE POLICY "Users can upload to own folder in user-uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-uploads' AND
    starts_with(name, auth.jwt()->>'user_id' || '/')
  );

CREATE POLICY "Users can read own files in user-uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-uploads' AND
    starts_with(name, auth.jwt()->>'user_id' || '/')
  );

CREATE POLICY "Users can update own files in user-uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-uploads' AND
    starts_with(name, auth.jwt()->>'user_id' || '/')
  )
  WITH CHECK (
    bucket_id = 'user-uploads' AND
    starts_with(name, auth.jwt()->>'user_id' || '/')
  );

CREATE POLICY "Users can delete own files in user-uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-uploads' AND
    starts_with(name, auth.jwt()->>'user_id' || '/')
  );

-- Storage policies for edited-images bucket
CREATE POLICY "Users can upload to own folder in edited-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'edited-images' AND
    starts_with(name, auth.jwt()->>'user_id' || '/')
  );

CREATE POLICY "Users can read own files in edited-images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'edited-images' AND
    starts_with(name, auth.jwt()->>'user_id' || '/')
  );

CREATE POLICY "Users can delete own files in edited-images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'edited-images' AND
    starts_with(name, auth.jwt()->>'user_id' || '/')
  );

-- Storage policies for generated-videos bucket
CREATE POLICY "Users can upload to own folder in generated-videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'generated-videos' AND
    starts_with(name, auth.jwt()->>'user_id' || '/')
  );

CREATE POLICY "Users can read own files in generated-videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'generated-videos' AND
    starts_with(name, auth.jwt()->>'user_id' || '/')
  );

CREATE POLICY "Users can delete own files in generated-videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'generated-videos' AND
    starts_with(name, auth.jwt()->>'user_id' || '/')
  );

-- Storage policies for thumbnails bucket
CREATE POLICY "Users can upload to own folder in thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'thumbnails' AND
    starts_with(name, auth.jwt()->>'user_id' || '/')
  );

CREATE POLICY "Users can read own files in thumbnails"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'thumbnails' AND
    starts_with(name, auth.jwt()->>'user_id' || '/')
  );

CREATE POLICY "Users can delete own files in thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'thumbnails' AND
    starts_with(name, auth.jwt()->>'user_id' || '/')
  );

COMMIT;
