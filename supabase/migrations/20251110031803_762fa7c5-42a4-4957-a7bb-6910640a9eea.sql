-- Create catalyst_campaigns table
CREATE TABLE IF NOT EXISTS public.catalyst_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_type text NOT NULL CHECK (campaign_type IN ('email', 'notification', 'sms', 'dm')),
  target_segment text NOT NULL CHECK (target_segment IN ('red', 'yellow', 'green', 'custom')),
  message_template text NOT NULL,
  offer_type text CHECK (offer_type IN ('discount', 'exclusive_content', 'early_access', 'challenge', 'poll', 'free_tracks')),
  offer_value jsonb DEFAULT '{}'::jsonb,
  trigger_conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  priority integer DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  max_sends_per_user integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create catalyst_executions table
CREATE TABLE IF NOT EXISTS public.catalyst_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.catalyst_campaigns(id),
  user_id uuid REFERENCES auth.users(id),
  ptp_score integer,
  era_score integer,
  segment text CHECK (segment IN ('observe', 'nurture', 'trigger')),
  message_sent text,
  channel text NOT NULL,
  scheduled_for timestamptz,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  converted_at timestamptz,
  conversion_value numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create match_matrix_scores table
CREATE TABLE IF NOT EXISTS public.match_matrix_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE,
  oracle_score integer DEFAULT 0 CHECK (oracle_score BETWEEN 0 AND 100),
  epiphany_score integer DEFAULT 0 CHECK (epiphany_score BETWEEN 0 AND 100),
  behavioral_score integer DEFAULT 0 CHECK (behavioral_score BETWEEN 0 AND 100),
  total_match_score integer GENERATED ALWAYS AS (oracle_score + epiphany_score + behavioral_score) STORED,
  segment text CHECK (segment IN ('observe', 'nurture', 'trigger')),
  recommended_actions jsonb DEFAULT '[]'::jsonb,
  last_updated timestamptz DEFAULT now()
);

-- Create catalyst_performance table
CREATE TABLE IF NOT EXISTS public.catalyst_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.catalyst_campaigns(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  total_sent integer DEFAULT 0,
  total_opened integer DEFAULT 0,
  total_clicked integer DEFAULT 0,
  total_converted integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  avg_conversion_value numeric DEFAULT 0,
  open_rate numeric DEFAULT 0,
  click_rate numeric DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_catalyst_executions_user ON public.catalyst_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_catalyst_executions_campaign ON public.catalyst_executions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_catalyst_executions_scheduled ON public.catalyst_executions(scheduled_for) WHERE sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_match_matrix_user ON public.match_matrix_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_match_matrix_segment ON public.match_matrix_scores(segment);

-- Enable RLS
ALTER TABLE public.catalyst_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalyst_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_matrix_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalyst_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for catalyst_campaigns
CREATE POLICY "Merchants can manage campaigns"
  ON public.catalyst_campaigns
  FOR ALL
  USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for catalyst_executions
CREATE POLICY "Merchants can view executions"
  ON public.catalyst_executions
  FOR SELECT
  USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage executions"
  ON public.catalyst_executions
  FOR ALL
  USING (true);

-- RLS Policies for match_matrix_scores
CREATE POLICY "Merchants can view match matrix"
  ON public.match_matrix_scores
  FOR SELECT
  USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage match matrix"
  ON public.match_matrix_scores
  FOR ALL
  USING (true);

-- RLS Policies for catalyst_performance
CREATE POLICY "Merchants can view performance"
  ON public.catalyst_performance
  FOR SELECT
  USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage performance"
  ON public.catalyst_performance
  FOR ALL
  USING (true);

-- Seed default campaign templates
INSERT INTO public.catalyst_campaigns (campaign_type, target_segment, message_template, offer_type, offer_value, trigger_conditions, priority) VALUES
-- GREEN ZONE: High-intent campaigns (PTP 80-100)
('email', 'green', 'Hey {first_name}! We see you vibing with JRNY 🎵 Your connection matters. Here''s 70% off our exclusive merch for the next 24 hours - just because you''re part of this flow.', 'discount', '{"discount_percent": 70, "expiry_hours": 24}'::jsonb, '{"min_ptp": 80, "max_ptp": 100}'::jsonb, 5),

('notification', 'green', '{first_name}, exclusive early access! Tickets to our next live event go on sale NOW - before anyone else. You''ve earned this. 🎟️', 'early_access', '{"content_type": "live_event_tickets"}'::jsonb, '{"min_ptp": 85, "behaviors": ["livestream_rsvp_attend"]}'::jsonb, 5),

('email', 'green', 'You left something in your cart 🛒 No pressure - but if it still speaks to you, here''s 15% off for the next 6 hours, {first_name}.', 'discount', '{"discount_percent": 15, "expiry_hours": 6}'::jsonb, '{"min_ptp": 70, "behaviors": ["cart_payment_abandon"]}'::jsonb, 4),

-- YELLOW ZONE: Nurture campaigns (PTP 50-79)
('email', 'yellow', 'We notice you''ve been exploring JRNY lately, {first_name}. Here''s something we made just for you - an unreleased acoustic track from the vault 🎸', 'exclusive_content', '{"content_type": "unreleased_track"}'::jsonb, '{"min_ptp": 50, "max_ptp": 79}'::jsonb, 3),

('notification', 'yellow', 'Quick question, {first_name}: Which track hits you hardest right now? We''re building something special based on your answer 🎵', 'poll', '{"type": "poll", "question": "favorite_track"}'::jsonb, '{"min_ptp": 50, "max_ptp": 79, "behaviors": ["multiple_songs_partial"]}'::jsonb, 3),

('email', 'yellow', 'Go deeper, {first_name}. Here''s exclusive studio footage from our latest session 🎬 Just for you.', 'exclusive_content', '{"content_type": "behind_the_scenes"}'::jsonb, '{"min_ptp": 60, "max_ptp": 79, "behaviors": ["high_time_spent"]}'::jsonb, 3),

-- RED ZONE: Re-engagement campaigns (PTP 0-49)
('email', 'red', '{first_name}, we miss your energy. It''s been a minute since you streamed. Here''s 3 new tracks we think you''ll love - on us. 💜', 'free_tracks', '{"content_type": "free_tracks", "count": 3}'::jsonb, '{"max_ptp": 49, "inactive_days": 14}'::jsonb, 2),

('notification', 'red', 'The community''s been asking about you, {first_name}. Come see what you''ve been missing 👋', 'exclusive_content', '{"content_type": "community_invite"}'::jsonb, '{"max_ptp": 49, "behaviors": ["community_view_no_post"]}'::jsonb, 2),

-- CROSS-SEGMENT: Behavioral triggers
('email', 'custom', 'We noticed you searched for something specific, {first_name}. Here''s what we have that might resonate 🔍', 'exclusive_content', '{"content_type": "search_results"}'::jsonb, '{"behaviors": ["search_query"]}'::jsonb, 3),

('notification', 'custom', 'You finished the whole album, {first_name}! Here''s a thank you gift from us 🎁', 'exclusive_content', '{"content_type": "completion_reward"}'::jsonb, '{"behaviors": ["album_streams", "full_livestream_watch"]}'::jsonb, 4),

('email', 'custom', '1 year with us, {first_name}! Here''s something special to celebrate our journey together 🎂', 'discount', '{"discount_percent": 50, "expiry_hours": 168}'::jsonb, '{"profile_age_days": 365}'::jsonb, 5),

('email', 'custom', 'We''re coming to your area, {first_name}! Want early tickets? 📍', 'early_access', '{"content_type": "location_based_event"}'::jsonb, '{"location_match": true}'::jsonb, 4)
ON CONFLICT DO NOTHING;