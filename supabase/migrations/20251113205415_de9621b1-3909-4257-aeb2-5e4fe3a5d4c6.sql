-- Fix livestream_viewers schema by adding missing columns
-- This addresses the schema mismatch from conflicting migrations

-- Add missing columns if they don't exist
ALTER TABLE public.livestream_viewers 
ADD COLUMN IF NOT EXISTS participant_id TEXT NOT NULL DEFAULT gen_random_uuid()::text;

ALTER TABLE public.livestream_viewers 
ADD COLUMN IF NOT EXISTS participant_name TEXT NOT NULL DEFAULT 'Anonymous Viewer';

ALTER TABLE public.livestream_viewers 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Drop existing constraint if it exists (from old migration)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'livestream_viewers_event_id_participant_id_key'
  ) THEN
    ALTER TABLE public.livestream_viewers 
    DROP CONSTRAINT livestream_viewers_event_id_participant_id_key;
  END IF;
END $$;

-- Add unique constraint
ALTER TABLE public.livestream_viewers 
ADD CONSTRAINT livestream_viewers_event_id_participant_id_key 
UNIQUE (event_id, participant_id);