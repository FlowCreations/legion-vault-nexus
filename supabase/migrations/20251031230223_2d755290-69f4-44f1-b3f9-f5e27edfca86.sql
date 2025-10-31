-- Create livestream signals table for WebRTC signaling
CREATE TABLE livestream_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES livestream_events(id) ON DELETE CASCADE,
  peer_id TEXT NOT NULL,
  peer_type TEXT NOT NULL CHECK (peer_type IN ('broadcaster', 'viewer')),
  signal_type TEXT NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice')),
  signal_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_livestream_signals_event ON livestream_signals(event_id);
CREATE INDEX idx_livestream_signals_peer ON livestream_signals(peer_id);
CREATE INDEX idx_livestream_signals_created ON livestream_signals(created_at);

-- Enable Row Level Security
ALTER TABLE livestream_signals ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert signals (needed for WebRTC handshake)
CREATE POLICY "Anyone can send signals" ON livestream_signals
  FOR INSERT WITH CHECK (true);

-- Allow anyone to view signals for active events
CREATE POLICY "Anyone can view signals" ON livestream_signals
  FOR SELECT USING (true);

-- Enable realtime for WebRTC signaling
ALTER PUBLICATION supabase_realtime ADD TABLE livestream_signals;