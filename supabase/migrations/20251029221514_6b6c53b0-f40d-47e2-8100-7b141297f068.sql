-- JRNY 12-Step Funnel System - Database Schema

-- 1. Funnel Pages Configuration Table
CREATE TABLE IF NOT EXISTS funnel_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number integer NOT NULL CHECK (step_number BETWEEN 1 AND 12),
  page_type text NOT NULL,
  variant_name text NOT NULL CHECK (variant_name IN ('A', 'B', 'C')),
  is_active boolean DEFAULT true,
  headline text,
  subheadline text,
  body_copy text,
  cta_text text,
  cta_url text,
  background_image_url text,
  product_id text,
  price numeric,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(step_number, variant_name)
);

-- 2. Funnel Sessions - Track user journey
CREATE TABLE IF NOT EXISTS funnel_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(user_id),
  session_id text NOT NULL,
  entry_step integer DEFAULT 1,
  current_step integer DEFAULT 1,
  variant_assignments jsonb DEFAULT '{}'::jsonb,
  completed_steps integer[] DEFAULT ARRAY[]::integer[],
  conversion_step integer,
  total_revenue numeric DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  abandoned_at timestamptz,
  meta jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_funnel_sessions_user ON funnel_sessions(user_id);
CREATE INDEX idx_funnel_sessions_session ON funnel_sessions(session_id);
CREATE INDEX idx_funnel_sessions_started ON funnel_sessions(started_at);

-- 3. Funnel Conversions - Track all conversion events
CREATE TABLE IF NOT EXISTS funnel_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES funnel_sessions(id),
  user_id uuid REFERENCES user_profiles(user_id),
  step_number integer NOT NULL,
  variant_name text NOT NULL,
  conversion_type text NOT NULL,
  product_id text,
  amount numeric,
  occurred_at timestamptz DEFAULT now(),
  meta jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_funnel_conversions_session ON funnel_conversions(session_id);
CREATE INDEX idx_funnel_conversions_user ON funnel_conversions(user_id);
CREATE INDEX idx_funnel_conversions_occurred ON funnel_conversions(occurred_at);

-- 4. A/B Test Results - Performance tracking
CREATE TABLE IF NOT EXISTS ab_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number integer NOT NULL,
  variant_name text NOT NULL,
  views integer DEFAULT 0,
  conversions integer DEFAULT 0,
  conversion_rate numeric GENERATED ALWAYS AS (
    CASE WHEN views > 0 THEN (conversions::numeric / views::numeric) * 100 ELSE 0 END
  ) STORED,
  total_revenue numeric DEFAULT 0,
  avg_order_value numeric GENERATED ALWAYS AS (
    CASE WHEN conversions > 0 THEN total_revenue / conversions ELSE 0 END
  ) STORED,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(step_number, variant_name)
);

-- 5. RLS Policies for funnel_pages
ALTER TABLE funnel_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active funnel pages"
  ON funnel_pages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Merchants can manage funnel pages"
  ON funnel_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('merchant', 'admin')
    )
  );

-- 6. RLS Policies for funnel_sessions
ALTER TABLE funnel_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON funnel_sessions FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Merchants can view all sessions"
  ON funnel_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('merchant', 'admin')
    )
  );

CREATE POLICY "System can manage sessions"
  ON funnel_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update sessions"
  ON funnel_sessions FOR UPDATE
  USING (true);

-- 7. RLS Policies for funnel_conversions
ALTER TABLE funnel_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversions"
  ON funnel_conversions FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Merchants can view all conversions"
  ON funnel_conversions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('merchant', 'admin')
    )
  );

CREATE POLICY "System can manage conversions"
  ON funnel_conversions FOR INSERT
  WITH CHECK (true);

-- 8. RLS Policies for ab_test_results
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view AB test results"
  ON ab_test_results FOR SELECT
  USING (true);

CREATE POLICY "Merchants can manage AB results"
  ON ab_test_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('merchant', 'admin')
    )
  );

-- 9. Insert default funnel page configurations (Step 1 - A/B/C variants)
INSERT INTO funnel_pages (step_number, page_type, variant_name, headline, subheadline, body_copy, cta_text, price)
VALUES 
  (1, 'lead_capture', 'A', 
   'Hey there, we don''t take it lightly that you showed up here.',
   'This isn''t just music — it''s something that got us through the hard stuff.',
   'If it connects with you even a little, it''s yours.',
   'Get My Free Album', 0),
  (1, 'lead_capture', 'B',
   'Not everyone looks for deeper songs anymore. But you did.',
   'That says something about you — and about what''s waiting on the other side.',
   '',
   'Get Your Free Access', 0),
  (1, 'lead_capture', 'C',
   'We''re not trying to sell you hype — just a sound 4M+ people found healing in.',
   '',
   '',
   'Get My Download Now', 0),
  (3, 'sales', 'A',
   'This album wasn''t made in a boardroom.',
   'It was recorded in a barn. Every lyric''s a piece of us.',
   '',
   'Get The Full Album — $10', 10),
  (3, 'sales', 'B',
   '🎧 Press play. Feel what millions already have.',
   '',
   '',
   'Unlock Instant Download', 10),
  (3, 'sales', 'C',
   '"Makes you feel like you''ve lived ten lives."',
   '– Verified Fan',
   '',
   'Own The Full Album Now — $10', 10)
ON CONFLICT (step_number, variant_name) DO NOTHING;

-- 10. Initialize AB test results for all steps/variants
INSERT INTO ab_test_results (step_number, variant_name)
SELECT s, v
FROM generate_series(1, 12) s
CROSS JOIN (VALUES ('A'), ('B'), ('C')) AS variants(v)
ON CONFLICT (step_number, variant_name) DO NOTHING;