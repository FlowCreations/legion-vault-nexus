-- Create table for storing Meta Pixel insights from Facebook API
CREATE TABLE IF NOT EXISTS public.meta_pixel_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pixel_id TEXT NOT NULL,
  date DATE NOT NULL,
  event_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  unique_users INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(pixel_id, date)
);

-- Enable RLS
ALTER TABLE public.meta_pixel_insights ENABLE ROW LEVEL SECURITY;

-- Allow merchants and admins to view insights
CREATE POLICY "Merchants and admins can view pixel insights"
  ON public.meta_pixel_insights
  FOR SELECT
  USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Allow system to insert/update insights
CREATE POLICY "System can manage pixel insights"
  ON public.meta_pixel_insights
  FOR ALL
  USING (true);

-- Add index for faster queries
CREATE INDEX idx_meta_pixel_insights_date ON public.meta_pixel_insights(date DESC);
CREATE INDEX idx_meta_pixel_insights_pixel_id ON public.meta_pixel_insights(pixel_id);