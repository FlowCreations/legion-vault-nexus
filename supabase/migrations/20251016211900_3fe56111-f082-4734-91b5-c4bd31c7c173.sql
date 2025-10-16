-- Create videos table to store video metadata
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  category TEXT NOT NULL CHECK (category IN ('music_videos', 'performances', 'behind_the_scenes', 'documentary')),
  storage_path TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  view_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Public can view all videos
CREATE POLICY "Videos are viewable by everyone"
ON public.videos
FOR SELECT
USING (true);

-- Authenticated users can upload videos
CREATE POLICY "Authenticated users can upload videos"
ON public.videos
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own videos
CREATE POLICY "Users can update their own videos"
ON public.videos
FOR UPDATE
USING (auth.uid() = uploaded_by);

-- Users can delete their own videos
CREATE POLICY "Users can delete their own videos"
ON public.videos
FOR DELETE
USING (auth.uid() = uploaded_by);

-- Create trigger for updated_at
CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();