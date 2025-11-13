-- Create storage bucket for VOD recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('vod-recordings', 'vod-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Create VOD recordings table
CREATE TABLE IF NOT EXISTS public.livestream_vods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.livestream_events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  stream_started_at TIMESTAMPTZ NOT NULL,
  stream_ended_at TIMESTAMPTZ,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create VOD views tracking table
CREATE TABLE IF NOT EXISTS public.vod_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vod_id UUID NOT NULL REFERENCES public.livestream_vods(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  watch_duration_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_vods_event_id ON public.livestream_vods(event_id);
CREATE INDEX IF NOT EXISTS idx_vods_status ON public.livestream_vods(processing_status);
CREATE INDEX IF NOT EXISTS idx_vods_created_at ON public.livestream_vods(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vod_views_vod_id ON public.vod_views(vod_id);
CREATE INDEX IF NOT EXISTS idx_vod_views_user_id ON public.vod_views(user_id);

-- Enable RLS
ALTER TABLE public.livestream_vods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vod_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for VODs
CREATE POLICY "Anyone can view VODs"
  ON public.livestream_vods
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create VODs"
  ON public.livestream_vods
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update VODs"
  ON public.livestream_vods
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for VOD views
CREATE POLICY "Users can view own VOD views"
  ON public.vod_views
  FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Anyone can insert VOD views"
  ON public.vod_views
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own VOD views"
  ON public.vod_views
  FOR UPDATE
  USING (user_id = auth.uid() OR session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

-- Add updated_at triggers
CREATE TRIGGER update_vods_updated_at
  BEFORE UPDATE ON public.livestream_vods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vod_views_updated_at
  BEFORE UPDATE ON public.vod_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies for VOD storage bucket
CREATE POLICY "Anyone can view VOD files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'vod-recordings');

CREATE POLICY "Authenticated users can upload VOD files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'vod-recordings' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update VOD files"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'vod-recordings' AND auth.uid() IS NOT NULL);

-- Enable realtime for VODs
ALTER PUBLICATION supabase_realtime ADD TABLE public.livestream_vods;