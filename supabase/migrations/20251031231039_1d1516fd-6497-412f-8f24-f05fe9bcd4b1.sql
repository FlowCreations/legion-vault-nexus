-- Create table for livestream tips
CREATE TABLE livestream_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES livestream_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  message TEXT,
  payment_intent_id TEXT,
  tipper_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE livestream_tips ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert tips (for guest tipping)
CREATE POLICY "Anyone can create tips"
  ON livestream_tips
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Policy: Users can view all tips for events they can see
CREATE POLICY "Anyone can view tips"
  ON livestream_tips
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Index for faster queries
CREATE INDEX idx_livestream_tips_event ON livestream_tips(event_id);
CREATE INDEX idx_livestream_tips_user ON livestream_tips(user_id);