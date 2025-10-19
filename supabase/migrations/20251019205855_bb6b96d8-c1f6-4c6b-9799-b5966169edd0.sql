-- Allow anyone to insert thumbnails
DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload thumbnails" ON storage.objects;

CREATE POLICY "Anyone can upload thumbnails"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'thumbnails');

-- Allow anyone to update thumbnails
DROP POLICY IF EXISTS "Authenticated users can update thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update thumbnails" ON storage.objects;

CREATE POLICY "Anyone can update thumbnails"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'thumbnails')
WITH CHECK (bucket_id = 'thumbnails');

-- Allow anyone to delete thumbnails
DROP POLICY IF EXISTS "Users can delete thumbnails" ON storage.objects;

CREATE POLICY "Anyone can delete thumbnails"
ON storage.objects
FOR DELETE
USING (bucket_id = 'thumbnails');