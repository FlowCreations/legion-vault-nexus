-- Create music-tracks storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('music-tracks', 'music-tracks', true);

-- Create music_tracks table
CREATE TABLE public.music_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT DEFAULT 'Sons of Legion',
  album TEXT,
  track_number INTEGER,
  duration TEXT,
  year TEXT,
  category TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  image_url TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view music tracks"
  ON public.music_tracks
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert music tracks"
  ON public.music_tracks
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'merchant'::app_role)
  );

CREATE POLICY "Admins can update music tracks"
  ON public.music_tracks
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'merchant'::app_role)
  );

CREATE POLICY "Admins can delete music tracks"
  ON public.music_tracks
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'merchant'::app_role)
  );

-- Storage policies for music-tracks bucket
CREATE POLICY "Anyone can view music files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'music-tracks');

CREATE POLICY "Admins can upload music files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'music-tracks' AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'merchant'::app_role))
  );

CREATE POLICY "Admins can delete music files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'music-tracks' AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'merchant'::app_role))
  );