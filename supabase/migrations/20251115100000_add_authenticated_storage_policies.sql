-- Add storage policies for authenticated users
-- This fixes the 404 error when uploading media files

BEGIN;

-- Storage policies for user-uploads bucket (authenticated users)
CREATE POLICY "Allow authenticated to upload to user-uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'user-uploads');

CREATE POLICY "Allow authenticated to read from user-uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'user-uploads');

CREATE POLICY "Allow authenticated to update in user-uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'user-uploads')
  WITH CHECK (bucket_id = 'user-uploads');

CREATE POLICY "Allow authenticated to delete from user-uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'user-uploads');

-- Storage policies for edited-images bucket (authenticated users)
CREATE POLICY "Allow authenticated to upload to edited-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'edited-images');

CREATE POLICY "Allow authenticated to read from edited-images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'edited-images');

CREATE POLICY "Allow authenticated to update in edited-images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'edited-images')
  WITH CHECK (bucket_id = 'edited-images');

CREATE POLICY "Allow authenticated to delete from edited-images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'edited-images');

-- Storage policies for generated-videos bucket (authenticated users)
CREATE POLICY "Allow authenticated to upload to generated-videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'generated-videos');

CREATE POLICY "Allow authenticated to read from generated-videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'generated-videos');

CREATE POLICY "Allow authenticated to update in generated-videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'generated-videos')
  WITH CHECK (bucket_id = 'generated-videos');

CREATE POLICY "Allow authenticated to delete from generated-videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'generated-videos');

-- Storage policies for thumbnails bucket (authenticated users)
CREATE POLICY "Allow authenticated to upload to thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Allow authenticated to read from thumbnails"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Allow authenticated to update in thumbnails"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'thumbnails')
  WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Allow authenticated to delete from thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'thumbnails');

COMMIT;
