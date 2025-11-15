-- Create video_comments table
CREATE TABLE public.video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  parent_comment_id UUID REFERENCES public.video_comments(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_video_comments_video_id ON public.video_comments(video_id);
CREATE INDEX idx_video_comments_user_id ON public.video_comments(user_id);
CREATE INDEX idx_video_comments_created_at ON public.video_comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view non-deleted comments
CREATE POLICY "Anyone can view non-deleted comments"
ON public.video_comments
FOR SELECT
USING (is_deleted = false);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON public.video_comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND is_deleted = false
  AND char_length(content) > 0 
  AND char_length(content) <= 500
);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.video_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete (soft delete) their own comments
CREATE POLICY "Users can delete their own comments"
ON public.video_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND is_deleted = false)
WITH CHECK (auth.uid() = user_id AND is_deleted = true);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_video_comments_updated_at
  BEFORE UPDATE ON public.video_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for video comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_comments;