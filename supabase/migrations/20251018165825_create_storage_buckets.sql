/*
  # Create Storage Buckets for User Media

  1. Storage Buckets
    - `user-uploads` - For original user-uploaded images and videos
    - `edited-images` - For AI-edited images
    - `generated-videos` - For AI-generated videos
    - `thumbnails` - For automatically generated thumbnails
  
  2. Security
    - Enable RLS on all buckets
    - Users can only upload to their own folders
    - Users can only read their own files
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('user-uploads', 'user-uploads', false, 104857600, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']),
  ('edited-images', 'edited-images', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('generated-videos', 'generated-videos', false, 209715200, ARRAY['video/mp4', 'video/webm']),
  ('thumbnails', 'thumbnails', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user-uploads bucket
CREATE POLICY "Users can upload to own folder in user-uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-uploads' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );

CREATE POLICY "Users can read own files in user-uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-uploads' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );

CREATE POLICY "Users can update own files in user-uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-uploads' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  )
  WITH CHECK (
    bucket_id = 'user-uploads' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );

CREATE POLICY "Users can delete own files in user-uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-uploads' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );

-- Storage policies for edited-images bucket
CREATE POLICY "Users can upload to own folder in edited-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'edited-images' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );

CREATE POLICY "Users can read own files in edited-images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'edited-images' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );

CREATE POLICY "Users can delete own files in edited-images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'edited-images' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );

-- Storage policies for generated-videos bucket
CREATE POLICY "Users can upload to own folder in generated-videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'generated-videos' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );

CREATE POLICY "Users can read own files in generated-videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'generated-videos' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );

CREATE POLICY "Users can delete own files in generated-videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'generated-videos' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );

-- Storage policies for thumbnails bucket
CREATE POLICY "Users can upload to own folder in thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'thumbnails' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );

CREATE POLICY "Users can read own files in thumbnails"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'thumbnails' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );

CREATE POLICY "Users can delete own files in thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'thumbnails' AND
    (storage.foldername(name))[1] = auth.jwt()->>'sub'
  );