-- Create livestream_reactions table to track user reactions during live streams
CREATE TABLE IF NOT EXISTS public.livestream_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID,
  session_id TEXT,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'clap')),
  timestamp_seconds NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.livestream_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert reactions (authenticated or anonymous via session_id)
CREATE POLICY "Anyone can add reactions"
ON public.livestream_reactions
FOR INSERT
WITH CHECK (true);

-- Policy: Users can view all reactions for analytics
CREATE POLICY "Anyone can view reactions"
ON public.livestream_reactions
FOR SELECT
USING (true);

-- Create index for fast queries by event
CREATE INDEX idx_livestream_reactions_event_id ON public.livestream_reactions(event_id);

-- Create index for user engagement queries
CREATE INDEX idx_livestream_reactions_user_id ON public.livestream_reactions(user_id) WHERE user_id IS NOT NULL;

-- Create index for timeline queries
CREATE INDEX idx_livestream_reactions_timestamp ON public.livestream_reactions(event_id, timestamp_seconds);