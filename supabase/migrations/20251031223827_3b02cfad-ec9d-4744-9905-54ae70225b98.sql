-- Create livestream events table
CREATE TABLE livestream_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status TEXT CHECK (status IN ('scheduled', 'live', 'ended')) DEFAULT 'scheduled',
  access_type TEXT CHECK (access_type IN ('free', 'vip', 'premium', 'paid')) DEFAULT 'free',
  stream_key TEXT,
  recording_url TEXT,
  viewer_count INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE livestream_events ENABLE ROW LEVEL SECURITY;

-- Policies for livestream_events
CREATE POLICY "Anyone can view livestream events"
  ON livestream_events FOR SELECT
  USING (true);

CREATE POLICY "Merchants can manage livestream events"
  ON livestream_events FOR ALL
  USING (
    has_role(auth.uid(), 'merchant'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create chat messages table
CREATE TABLE livestream_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES livestream_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  is_bot BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE livestream_chat ENABLE ROW LEVEL SECURITY;

-- Policies for chat
CREATE POLICY "Anyone can view chat messages"
  ON livestream_chat FOR SELECT
  USING (is_deleted = FALSE);

CREATE POLICY "Authenticated users can send messages"
  ON livestream_chat FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Merchants can manage chat"
  ON livestream_chat FOR ALL
  USING (
    has_role(auth.uid(), 'merchant'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create chatbot templates table
CREATE TABLE chatbot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL CHECK (LENGTH(message) <= 230),
  link_url TEXT,
  link_text TEXT,
  interval_minutes INTEGER DEFAULT 10,
  slot_number INTEGER CHECK (slot_number BETWEEN 1 AND 5),
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chatbot_templates ENABLE ROW LEVEL SECURITY;

-- Policies for chatbot templates
CREATE POLICY "Merchants can manage chatbot templates"
  ON chatbot_templates FOR ALL
  USING (
    has_role(auth.uid(), 'merchant'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create viewer tracking table
CREATE TABLE livestream_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES livestream_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  total_watch_time INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE livestream_viewers ENABLE ROW LEVEL SECURITY;

-- Policies for viewer tracking
CREATE POLICY "Merchants can view all viewers"
  ON livestream_viewers FOR SELECT
  USING (
    has_role(auth.uid(), 'merchant'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Anyone can track their viewing"
  ON livestream_viewers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own viewing records"
  ON livestream_viewers FOR UPDATE
  USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE livestream_chat;

-- Create index for better performance
CREATE INDEX idx_chat_event_id ON livestream_chat(event_id, created_at DESC);
CREATE INDEX idx_viewers_event_id ON livestream_viewers(event_id);
CREATE INDEX idx_events_status ON livestream_events(status, scheduled_start);