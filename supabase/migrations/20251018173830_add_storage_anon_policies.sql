/*
  # Add Storage Policies for Anonymous Users (Local Development)

  1. Changes
    - Add permissive storage policies for anon (anonymous) role
    - Allow anonymous users to upload, read, update, and delete files in all buckets
    - This enables local testing without authentication

  2. Security Notes
    - These policies are for local development only
    - In production, these should be disabled and only authenticated policies used
    - Anonymous access is granted to all storage buckets for development purposes
*/

-- Storage policies for user-uploads bucket (anonymous users)
CREATE POLICY "Allow anon to upload to user-uploads"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'user-uploads');

CREATE POLICY "Allow anon to read from user-uploads"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'user-uploads');

CREATE POLICY "Allow anon to update in user-uploads"
  ON storage.objects FOR UPDATE
  TO anon
  USING (bucket_id = 'user-uploads')
  WITH CHECK (bucket_id = 'user-uploads');

CREATE POLICY "Allow anon to delete from user-uploads"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'user-uploads');

-- Storage policies for edited-images bucket (anonymous users)
CREATE POLICY "Allow anon to upload to edited-images"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'edited-images');

CREATE POLICY "Allow anon to read from edited-images"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'edited-images');

CREATE POLICY "Allow anon to update in edited-images"
  ON storage.objects FOR UPDATE
  TO anon
  USING (bucket_id = 'edited-images')
  WITH CHECK (bucket_id = 'edited-images');

CREATE POLICY "Allow anon to delete from edited-images"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'edited-images');

-- Storage policies for generated-videos bucket (anonymous users)
CREATE POLICY "Allow anon to upload to generated-videos"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'generated-videos');

CREATE POLICY "Allow anon to read from generated-videos"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'generated-videos');

CREATE POLICY "Allow anon to update in generated-videos"
  ON storage.objects FOR UPDATE
  TO anon
  USING (bucket_id = 'generated-videos')
  WITH CHECK (bucket_id = 'generated-videos');

CREATE POLICY "Allow anon to delete from generated-videos"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'generated-videos');

-- Storage policies for thumbnails bucket (anonymous users)
CREATE POLICY "Allow anon to upload to thumbnails"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Allow anon to read from thumbnails"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Allow anon to update in thumbnails"
  ON storage.objects FOR UPDATE
  TO anon
  USING (bucket_id = 'thumbnails')
  WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Allow anon to delete from thumbnails"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'thumbnails');
