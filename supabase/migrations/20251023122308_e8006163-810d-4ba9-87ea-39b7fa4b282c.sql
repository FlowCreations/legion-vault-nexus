-- Add analytics columns to affiliate_content table
ALTER TABLE affiliate_content 
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS spotify_track_id TEXT,
ADD COLUMN IF NOT EXISTS spotify_album_id TEXT,
ADD COLUMN IF NOT EXISTS spotify_artist_id TEXT,
ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
ADD COLUMN IF NOT EXISTS release_date TEXT,
ADD COLUMN IF NOT EXISTS album_name TEXT,
ADD COLUMN IF NOT EXISTS artist_name TEXT;

-- Create affiliate_content_clicks table for detailed tracking
CREATE TABLE IF NOT EXISTS affiliate_content_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES affiliate_content(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clicks_content ON affiliate_content_clicks(content_id);
CREATE INDEX IF NOT EXISTS idx_clicks_user ON affiliate_content_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_session ON affiliate_content_clicks(session_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON affiliate_content_clicks(clicked_at);

-- Enable RLS on affiliate_content_clicks
ALTER TABLE affiliate_content_clicks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert click records (for tracking)
CREATE POLICY "Anyone can track clicks" ON affiliate_content_clicks
  FOR INSERT WITH CHECK (true);

-- Policy: Authenticated users can view all click records
CREATE POLICY "Authenticated users can view clicks" ON affiliate_content_clicks
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create function to track clicks
CREATE OR REPLACE FUNCTION track_affiliate_content_click(
  p_content_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert click record
  INSERT INTO affiliate_content_clicks (
    content_id, 
    user_id, 
    session_id, 
    referrer, 
    user_agent
  ) VALUES (
    p_content_id, 
    p_user_id, 
    p_session_id, 
    p_referrer, 
    p_user_agent
  );
  
  -- Update aggregate counter
  UPDATE affiliate_content 
  SET 
    click_count = COALESCE(click_count, 0) + 1,
    last_clicked_at = NOW()
  WHERE id = p_content_id;
END;
$$;