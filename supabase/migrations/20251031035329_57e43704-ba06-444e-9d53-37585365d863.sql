-- Create video_favorites table
CREATE TABLE video_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Enable RLS
ALTER TABLE video_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own favorites"
  ON video_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON video_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON video_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_video_favorites_user_id ON video_favorites(user_id);
CREATE INDEX idx_video_favorites_video_id ON video_favorites(video_id);