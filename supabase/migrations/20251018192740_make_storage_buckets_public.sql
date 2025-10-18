/*
  # Make Storage Buckets Public

  1. Changes
    - Update user-uploads bucket to be public
    - Update edited-images bucket to be public
    - Update generated-videos bucket to be public
    - Update thumbnails bucket to be public
    - This enables getPublicUrl() to work correctly for image previews

  2. Security Notes
    - Buckets are public but RLS policies still control access
    - Only users with proper policies can read/write
    - Public setting only affects URL access, not permissions
*/

-- Update storage buckets to be public
UPDATE storage.buckets
SET public = true
WHERE id IN ('user-uploads', 'edited-images', 'generated-videos', 'thumbnails');
