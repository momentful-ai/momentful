/*
  # Enable Row Level Security on Lineages Table

  1. Changes
    - Enable RLS on lineages table
    - Add policies for authenticated users to access only their own lineages
    - Add policies for anonymous users (local development)
    
  2. Security
    - Users can only view/modify lineages where user_id matches their JWT sub claim
    - Anonymous users have full access for local development
*/

-- Enable Row Level Security
ALTER TABLE lineages ENABLE ROW LEVEL SECURITY;

-- Authenticated user policies
CREATE POLICY "Users can view own lineages"
  ON lineages FOR SELECT
  TO authenticated
  USING (user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can create own lineages"
  ON lineages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can update own lineages"
  ON lineages FOR UPDATE
  TO authenticated
  USING (user_id = auth.jwt()->>'sub')
  WITH CHECK (user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can delete own lineages"
  ON lineages FOR DELETE
  TO authenticated
  USING (user_id = auth.jwt()->>'sub');

-- Anonymous user policies (local development)
CREATE POLICY "Allow anon to view all lineages"
  ON lineages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to create lineages"
  ON lineages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update all lineages"
  ON lineages FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete all lineages"
  ON lineages FOR DELETE
  TO anon
  USING (true);


