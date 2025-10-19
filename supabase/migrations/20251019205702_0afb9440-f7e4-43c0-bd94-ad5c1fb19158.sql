-- Allow public access to update videos (for link-based editing)
DROP POLICY IF EXISTS "Users and admins can update videos" ON videos;

CREATE POLICY "Anyone can update videos"
ON videos
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow public access to insert videos
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON videos;

CREATE POLICY "Anyone can upload videos"
ON videos
FOR INSERT
WITH CHECK (true);

-- Keep delete restricted to video owner for safety
-- (already exists: "Users can delete their own videos")