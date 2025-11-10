-- Add stream_start_time column to livestream_events table
ALTER TABLE public.livestream_events 
ADD COLUMN IF NOT EXISTS stream_start_time TIMESTAMP WITH TIME ZONE;