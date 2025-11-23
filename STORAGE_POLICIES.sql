-- =====================================================
-- STORAGE BUCKET POLICIES
-- Sons of Legion - Supabase Pro Migration
-- =====================================================

-- =====================================================
-- VIDEOS BUCKET (Public)
-- =====================================================

-- Anyone can view videos
CREATE POLICY "Videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Authenticated users can upload videos
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  auth.uid() IS NOT NULL
);

-- Users can update their own videos
CREATE POLICY "Users can update their own videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own videos
CREATE POLICY "Users can delete their own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- THUMBNAILS BUCKET (Public)
-- =====================================================

-- Anyone can view thumbnails
CREATE POLICY "Thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

-- Authenticated users can upload thumbnails
CREATE POLICY "Authenticated users can upload thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails' AND
  auth.uid() IS NOT NULL
);

-- Users can update their own thumbnails
CREATE POLICY "Users can update their own thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own thumbnails
CREATE POLICY "Users can delete their own thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- PROFILE PICTURES BUCKET (Public)
-- =====================================================

-- Anyone can view profile pictures
CREATE POLICY "Profile pictures are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Users can upload their own profile picture
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own profile picture
CREATE POLICY "Users can update their own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own profile picture
CREATE POLICY "Users can delete their own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- CAMEO VIDEOS BUCKET (Public)
-- =====================================================

-- Anyone can view cameo videos
CREATE POLICY "Cameo videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'cameo-videos');

-- Merchants and admins can upload cameo videos
CREATE POLICY "Merchants can upload cameo videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cameo-videos' AND
  (
    has_role(auth.uid(), 'merchant'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Merchants and admins can update cameo videos
CREATE POLICY "Merchants can update cameo videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cameo-videos' AND
  (
    has_role(auth.uid(), 'merchant'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Merchants and admins can delete cameo videos
CREATE POLICY "Merchants can delete cameo videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cameo-videos' AND
  (
    has_role(auth.uid(), 'merchant'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- =====================================================
-- MUSIC TRACKS BUCKET (Public)
-- =====================================================

-- Anyone can view music tracks
CREATE POLICY "Music tracks are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'music-tracks');

-- Authenticated users can upload music
CREATE POLICY "Authenticated users can upload music"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'music-tracks' AND
  auth.uid() IS NOT NULL
);

-- Users can update their own music
CREATE POLICY "Users can update their own music"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'music-tracks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own music
CREATE POLICY "Users can delete their own music"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'music-tracks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- EMAIL ASSETS BUCKET (Public)
-- =====================================================

-- Anyone can view email assets
CREATE POLICY "Email assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-assets');

-- Merchants and admins can upload email assets
CREATE POLICY "Merchants can upload email assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'email-assets' AND
  (
    has_role(auth.uid(), 'merchant'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Merchants and admins can update email assets
CREATE POLICY "Merchants can update email assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'email-assets' AND
  (
    has_role(auth.uid(), 'merchant'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Merchants and admins can delete email assets
CREATE POLICY "Merchants can delete email assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'email-assets' AND
  (
    has_role(auth.uid(), 'merchant'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- =====================================================
-- VOD RECORDINGS BUCKET (Public)
-- =====================================================

-- Anyone can view VOD recordings
CREATE POLICY "VOD recordings are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'vod-recordings');

-- Merchants and admins can upload VOD recordings
CREATE POLICY "Merchants can upload VOD recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vod-recordings' AND
  (
    has_role(auth.uid(), 'merchant'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Merchants and admins can update VOD recordings
CREATE POLICY "Merchants can update VOD recordings"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vod-recordings' AND
  (
    has_role(auth.uid(), 'merchant'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Merchants and admins can delete VOD recordings
CREATE POLICY "Merchants can delete VOD recordings"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vod-recordings' AND
  (
    has_role(auth.uid(), 'merchant'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- =====================================================
-- STORAGE POLICIES COMPLETE
-- =====================================================
