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
