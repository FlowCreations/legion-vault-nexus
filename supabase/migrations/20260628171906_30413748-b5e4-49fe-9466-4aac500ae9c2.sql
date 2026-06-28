
CREATE TABLE public.artist_streaming_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  embed_url TEXT,
  label TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.artist_streaming_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artist_streaming_links TO authenticated;
GRANT ALL ON public.artist_streaming_links TO service_role;

ALTER TABLE public.artist_streaming_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view streaming links"
  ON public.artist_streaming_links FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage streaming links"
  ON public.artist_streaming_links FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_artist_streaming_links_updated_at
  BEFORE UPDATE ON public.artist_streaming_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
