CREATE TABLE IF NOT EXISTS public.youtube_channel_cache (
  channel_id text PRIMARY KEY,
  channel_title text,
  payload jsonb NOT NULL,
  video_count integer NOT NULL DEFAULT 0,
  source text,
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '6 hours'
);
GRANT SELECT ON public.youtube_channel_cache TO anon, authenticated;
GRANT ALL ON public.youtube_channel_cache TO service_role;
ALTER TABLE public.youtube_channel_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cache readable" ON public.youtube_channel_cache FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS youtube_channel_cache_expires_idx ON public.youtube_channel_cache(expires_at);