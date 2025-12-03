-- JRNY Universal Identity System Tables

-- 1. JRNY Visitors (Anonymous tracking - the core identity graph)
CREATE TABLE jrny_visitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jrny_id TEXT UNIQUE NOT NULL,
  device_fingerprint TEXT,
  
  -- First interaction details
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  first_tenant_id UUID REFERENCES tenants(id),
  first_landing_page TEXT,
  first_referrer TEXT,
  
  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Device info
  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  
  -- Aggregate stats
  total_page_views INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 1,
  total_time_seconds INTEGER DEFAULT 0,
  portals_visited TEXT[] DEFAULT '{}',
  
  -- Scoring
  engagement_score INTEGER DEFAULT 0,
  heat_level TEXT DEFAULT 'cold',
  
  -- Identity resolution
  email TEXT,
  converted_user_id UUID,
  identity_revealed_at TIMESTAMPTZ,
  
  -- Metadata
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. JRNY Portal Visits (Cross-portal tracking)
CREATE TABLE jrny_portal_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jrny_id TEXT NOT NULL REFERENCES jrny_visitors(jrny_id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  session_id TEXT NOT NULL,
  
  -- Visit details
  landing_page TEXT,
  referrer_url TEXT,
  pages_viewed TEXT[] DEFAULT '{}',
  
  -- Engagement
  page_views INTEGER DEFAULT 1,
  time_on_site_seconds INTEGER DEFAULT 0,
  scroll_depth_max INTEGER DEFAULT 0,
  
  -- Actions
  music_plays INTEGER DEFAULT 0,
  video_watches INTEGER DEFAULT 0,
  merch_views INTEGER DEFAULT 0,
  add_to_cart BOOLEAN DEFAULT FALSE,
  purchase_made BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. JRNY Behavioral Events (Detailed activity log)
CREATE TABLE jrny_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jrny_id TEXT NOT NULL REFERENCES jrny_visitors(jrny_id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  session_id TEXT,
  
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. JRNY Fingerprint Recovery (Link fingerprints to jrny_ids)
CREATE TABLE jrny_fingerprint_map (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint_hash TEXT NOT NULL,
  jrny_id TEXT NOT NULL REFERENCES jrny_visitors(jrny_id) ON DELETE CASCADE,
  confidence NUMERIC DEFAULT 1.0,
  last_matched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(fingerprint_hash, jrny_id)
);

-- Indexes for performance
CREATE INDEX idx_jrny_visitors_jrny_id ON jrny_visitors(jrny_id);
CREATE INDEX idx_jrny_visitors_fingerprint ON jrny_visitors(device_fingerprint);
CREATE INDEX idx_jrny_visitors_email ON jrny_visitors(email);
CREATE INDEX idx_jrny_visitors_heat ON jrny_visitors(heat_level);
CREATE INDEX idx_jrny_visitors_last_seen ON jrny_visitors(last_seen_at);
CREATE INDEX idx_jrny_portal_visits_jrny ON jrny_portal_visits(jrny_id);
CREATE INDEX idx_jrny_portal_visits_tenant ON jrny_portal_visits(tenant_id);
CREATE INDEX idx_jrny_portal_visits_session ON jrny_portal_visits(session_id);
CREATE INDEX idx_jrny_events_jrny ON jrny_events(jrny_id);
CREATE INDEX idx_jrny_events_type ON jrny_events(event_type);
CREATE INDEX idx_jrny_events_created ON jrny_events(created_at);
CREATE INDEX idx_jrny_fingerprint_hash ON jrny_fingerprint_map(fingerprint_hash);

-- Enable RLS
ALTER TABLE jrny_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE jrny_portal_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE jrny_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE jrny_fingerprint_map ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jrny_visitors
CREATE POLICY "System can manage visitors" ON jrny_visitors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Merchants can view visitors" ON jrny_visitors FOR SELECT 
  USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for jrny_portal_visits
CREATE POLICY "System can manage portal visits" ON jrny_portal_visits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Merchants can view portal visits" ON jrny_portal_visits FOR SELECT 
  USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for jrny_events
CREATE POLICY "System can manage events" ON jrny_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Merchants can view events" ON jrny_events FOR SELECT 
  USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for jrny_fingerprint_map
CREATE POLICY "System can manage fingerprints" ON jrny_fingerprint_map FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Merchants can view fingerprints" ON jrny_fingerprint_map FOR SELECT 
  USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Function to calculate engagement score and heat level
CREATE OR REPLACE FUNCTION calculate_jrny_engagement(p_jrny_id TEXT)
RETURNS TABLE(score INTEGER, heat TEXT) AS $$
DECLARE
  v_score INTEGER := 0;
  v_heat TEXT := 'cold';
  v_visitor RECORD;
  v_portal_count INTEGER;
  v_event_counts RECORD;
BEGIN
  -- Get visitor stats
  SELECT * INTO v_visitor FROM jrny_visitors WHERE jrny_id = p_jrny_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 'cold'::TEXT;
    RETURN;
  END IF;
  
  -- Base score from page views
  v_score := COALESCE(v_visitor.total_page_views, 0);
  
  -- Count portals visited
  v_portal_count := COALESCE(array_length(v_visitor.portals_visited, 1), 0);
  v_score := v_score + (v_portal_count * 10);
  
  -- Count events by type
  SELECT 
    COUNT(*) FILTER (WHERE event_type = 'music_play') * 3 +
    COUNT(*) FILTER (WHERE event_type = 'video_watch') * 2 +
    COUNT(*) FILTER (WHERE event_type = 'merch_view') * 5 +
    COUNT(*) FILTER (WHERE event_type = 'add_to_cart') * 15 +
    COUNT(*) FILTER (WHERE event_type = 'purchase') * 50 +
    COUNT(*) FILTER (WHERE event_type = 'email_signup') * 25 +
    COUNT(*) FILTER (WHERE event_type = 'return_visit') * 5
  INTO v_score
  FROM jrny_events WHERE jrny_id = p_jrny_id;
  
  v_score := COALESCE(v_score, 0) + COALESCE(v_visitor.total_page_views, 0) + (v_portal_count * 10);
  
  -- Determine heat level
  IF v_score >= 150 THEN
    v_heat := 'superfan';
  ELSIF v_score >= 51 THEN
    v_heat := 'hot';
  ELSIF v_score >= 11 THEN
    v_heat := 'warm';
  ELSE
    v_heat := 'cold';
  END IF;
  
  -- Update the visitor record
  UPDATE jrny_visitors 
  SET engagement_score = v_score, heat_level = v_heat, updated_at = NOW()
  WHERE jrny_id = p_jrny_id;
  
  RETURN QUERY SELECT v_score, v_heat;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to link visitor to user on auth
CREATE OR REPLACE FUNCTION link_jrny_visitor_to_user(p_jrny_id TEXT, p_user_id UUID, p_email TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  UPDATE jrny_visitors 
  SET 
    converted_user_id = p_user_id,
    email = COALESCE(p_email, email),
    identity_revealed_at = COALESCE(identity_revealed_at, NOW()),
    updated_at = NOW()
  WHERE jrny_id = p_jrny_id;
  
  -- Also update user_profiles with jrny_member_id
  UPDATE user_profiles
  SET jrny_member_id = p_jrny_id
  WHERE user_id = p_user_id AND jrny_member_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable realtime for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE jrny_visitors;
ALTER PUBLICATION supabase_realtime ADD TABLE jrny_events;