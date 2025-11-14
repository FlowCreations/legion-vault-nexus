-- Add lyrics column to music_tracks table
ALTER TABLE public.music_tracks
ADD COLUMN IF NOT EXISTS lyrics TEXT;