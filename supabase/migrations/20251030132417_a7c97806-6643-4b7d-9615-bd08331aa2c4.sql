-- Create table for caching Viberate API responses
CREATE TABLE IF NOT EXISTS public.viberate_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  data JSONB NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_viberate_artist ON public.viberate_metrics(artist_id);
CREATE INDEX IF NOT EXISTS idx_viberate_synced ON public.viberate_metrics(synced_at DESC);

-- Enable RLS
ALTER TABLE public.viberate_metrics ENABLE ROW LEVEL SECURITY;

-- Public can read viberate metrics
CREATE POLICY "Viberate metrics are publicly viewable"
  ON public.viberate_metrics
  FOR SELECT
  USING (true);

-- Service role can manage viberate metrics
CREATE POLICY "Service role can manage viberate metrics"
  ON public.viberate_metrics
  FOR ALL
  USING (true);