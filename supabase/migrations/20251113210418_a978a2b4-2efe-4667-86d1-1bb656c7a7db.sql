-- Create livestream_highlights table for saving best moments
CREATE TABLE IF NOT EXISTS public.livestream_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.livestream_events(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time_seconds INTEGER NOT NULL,
  end_time_seconds INTEGER NOT NULL,
  duration_seconds INTEGER GENERATED ALWAYS AS (end_time_seconds - start_time_seconds) STORED,
  thumbnail_url TEXT,
  video_url TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_highlights_event_id ON public.livestream_highlights(event_id);
CREATE INDEX IF NOT EXISTS idx_highlights_created_by ON public.livestream_highlights(created_by);
CREATE INDEX IF NOT EXISTS idx_highlights_created_at ON public.livestream_highlights(created_at DESC);

-- Enable RLS
ALTER TABLE public.livestream_highlights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view highlights
CREATE POLICY "Anyone can view highlights"
  ON public.livestream_highlights
  FOR SELECT
  USING (true);

-- Authenticated users can create highlights
CREATE POLICY "Authenticated users can create highlights"
  ON public.livestream_highlights
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own highlights
CREATE POLICY "Users can update own highlights"
  ON public.livestream_highlights
  FOR UPDATE
  USING (created_by = auth.uid());

-- Users can delete their own highlights
CREATE POLICY "Users can delete own highlights"
  ON public.livestream_highlights
  FOR DELETE
  USING (created_by = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_highlights_updated_at
  BEFORE UPDATE ON public.livestream_highlights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();