-- Create content_analyses table for storing video analysis results
CREATE TABLE IF NOT EXISTS public.content_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES auth.users(id) NOT NULL,
  video_title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  video_duration INTEGER,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  hook_score INTEGER CHECK (hook_score >= 0 AND hook_score <= 100),
  pacing_score INTEGER CHECK (pacing_score >= 0 AND pacing_score <= 100),
  visual_score INTEGER CHECK (visual_score >= 0 AND visual_score <= 100),
  predicted_dropoff_points JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  frame_analysis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.content_analyses ENABLE ROW LEVEL SECURITY;

-- Merchants can view their own analyses
CREATE POLICY "Merchants can view their own analyses"
  ON public.content_analyses
  FOR SELECT
  USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Merchants can insert their own analyses
CREATE POLICY "Merchants can insert analyses"
  ON public.content_analyses
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Merchants can delete their own analyses
CREATE POLICY "Merchants can delete their own analyses"
  ON public.content_analyses
  FOR DELETE
  USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));