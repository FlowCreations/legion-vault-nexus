-- Create livestream_viewers table for tracking live viewers
CREATE TABLE IF NOT EXISTS public.livestream_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.livestream_events(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  avatar_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  total_watch_time INTEGER DEFAULT 0,
  UNIQUE(event_id, participant_id)
);

-- Enable RLS
ALTER TABLE public.livestream_viewers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read viewers (for displaying who's watching)
CREATE POLICY "Anyone can view livestream viewers"
  ON public.livestream_viewers
  FOR SELECT
  USING (true);

-- Allow inserting viewer records
CREATE POLICY "Anyone can insert viewer records"
  ON public.livestream_viewers
  FOR INSERT
  WITH CHECK (true);

-- Allow updating own viewer record
CREATE POLICY "Anyone can update viewer records"
  ON public.livestream_viewers
  FOR UPDATE
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.livestream_viewers;