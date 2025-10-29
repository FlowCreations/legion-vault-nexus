-- Phase 1: Database Schema Enhancements

-- 1. user_behavior_profiles table
CREATE TABLE user_behavior_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(user_id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_visits integer DEFAULT 0,
  total_session_time_seconds integer DEFAULT 0,
  favorite_content_types jsonb DEFAULT '{}'::jsonb,
  favorite_tracks text[],
  favorite_products text[],
  engagement_score numeric DEFAULT 0,
  last_visit_at timestamptz,
  visit_frequency text,
  purchase_history_summary jsonb DEFAULT '{}'::jsonb,
  music_taste_profile jsonb DEFAULT '{}'::jsonb,
  behavioral_segments text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. user_preferences table
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(user_id) ON DELETE CASCADE UNIQUE NOT NULL,
  agent_enabled boolean DEFAULT true,
  last_agent_message_at timestamptz,
  agent_message_count integer DEFAULT 0,
  agent_messages_dismissed_count integer DEFAULT 0,
  preferred_communication_style text DEFAULT 'casual',
  do_not_disturb_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. user_insights table
CREATE TABLE user_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  insight_type text NOT NULL,
  insight_data jsonb NOT NULL,
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- 4. Enhance agent_interactions table
ALTER TABLE agent_interactions 
ADD COLUMN IF NOT EXISTS behavior_context jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS conversion_resulted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS conversion_event_id uuid REFERENCES events(id),
ADD COLUMN IF NOT EXISTS conversion_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_dismissed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS user_clicked_cta boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS interaction_outcome text;

-- 5. RLS Policies
ALTER TABLE user_behavior_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_insights ENABLE ROW LEVEL SECURITY;

-- Merchants/admins can view all behavior profiles
CREATE POLICY "Merchants can view behavior profiles"
ON user_behavior_profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('merchant', 'admin')
  )
);

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
ON user_preferences FOR SELECT
TO authenticated
USING (user_id IN (SELECT user_id FROM user_profiles WHERE user_id = auth.uid()));

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
ON user_preferences FOR UPDATE
TO authenticated
USING (user_id IN (SELECT user_id FROM user_profiles WHERE user_id = auth.uid()));

-- Merchants can view insights
CREATE POLICY "Merchants can view insights"
ON user_insights FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('merchant', 'admin')
  )
);

-- System can manage all tables (service role)
CREATE POLICY "System can manage behavior profiles"
ON user_behavior_profiles FOR ALL
USING (true);

CREATE POLICY "System can manage preferences"
ON user_preferences FOR ALL
USING (true);

CREATE POLICY "System can manage insights"
ON user_insights FOR ALL
USING (true);

-- 6. Indexes for performance
CREATE INDEX idx_user_behavior_profiles_user_id ON user_behavior_profiles(user_id);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_insights_user_id ON user_insights(user_id);
CREATE INDEX idx_user_insights_type ON user_insights(insight_type);
CREATE INDEX idx_agent_interactions_outcome ON agent_interactions(interaction_outcome);
CREATE INDEX idx_agent_interactions_conversion ON agent_interactions(conversion_resulted);

-- 7. Auto-update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_behavior_profiles_updated_at
BEFORE UPDATE ON user_behavior_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();