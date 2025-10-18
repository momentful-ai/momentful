/*
  # Add Local Development Policies

  1. Changes
    - Add permissive policies for anon (anonymous) role to allow local development
    - These policies allow full CRUD operations for all users when not authenticated
    - This enables local testing without Clerk authentication
    
  2. Security Notes
    - In production, these policies should be disabled or restricted
    - The existing authenticated policies remain in place for production use
    - Anonymous access is granted to all tables for development purposes only
*/

-- Projects policies for anonymous users (local development)
CREATE POLICY "Allow anon to view all projects"
  ON projects FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to create projects"
  ON projects FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update all projects"
  ON projects FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete all projects"
  ON projects FOR DELETE
  TO anon
  USING (true);

-- Media assets policies for anonymous users
CREATE POLICY "Allow anon to view all media assets"
  ON media_assets FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to create media assets"
  ON media_assets FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update all media assets"
  ON media_assets FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete all media assets"
  ON media_assets FOR DELETE
  TO anon
  USING (true);

-- Edited images policies for anonymous users
CREATE POLICY "Allow anon to view all edited images"
  ON edited_images FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to create edited images"
  ON edited_images FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update all edited images"
  ON edited_images FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete all edited images"
  ON edited_images FOR DELETE
  TO anon
  USING (true);

-- Generated videos policies for anonymous users
CREATE POLICY "Allow anon to view all generated videos"
  ON generated_videos FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to create generated videos"
  ON generated_videos FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update all generated videos"
  ON generated_videos FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete all generated videos"
  ON generated_videos FOR DELETE
  TO anon
  USING (true);

-- Video sources policies for anonymous users
CREATE POLICY "Allow anon to view all video sources"
  ON video_sources FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to create video sources"
  ON video_sources FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete all video sources"
  ON video_sources FOR DELETE
  TO anon
  USING (true);
