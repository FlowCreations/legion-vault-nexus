-- Create personality_profiles table
CREATE TABLE IF NOT EXISTS personality_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- MBTI scores (0-1 probabilities)
  p_e NUMERIC NOT NULL DEFAULT 0.5,
  p_i NUMERIC NOT NULL DEFAULT 0.5,
  p_s NUMERIC NOT NULL DEFAULT 0.5,
  p_n NUMERIC NOT NULL DEFAULT 0.5,
  p_t NUMERIC NOT NULL DEFAULT 0.5,
  p_f NUMERIC NOT NULL DEFAULT 0.5,
  p_j NUMERIC NOT NULL DEFAULT 0.5,
  p_p NUMERIC NOT NULL DEFAULT 0.5,
  
  -- Computed results
  mbti_type TEXT,
  assertiveness NUMERIC DEFAULT 0.5,
  confidence_score NUMERIC DEFAULT 0.5,
  
  -- Raw survey responses (stored as JSONB)
  survey_responses JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  feature_vector JSONB,
  last_computed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create personality_features table for behavioral tracking
CREATE TABLE IF NOT EXISTS personality_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  time_window TEXT NOT NULL, -- '24h', '7d', '28d', 'lifetime'
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, feature_name, time_window)
);

-- Enable RLS
ALTER TABLE personality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personality_profiles
CREATE POLICY "Users can view own personality profile"
  ON personality_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Merchants can view all personality profiles"
  ON personality_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('merchant', 'admin')
    )
  );

CREATE POLICY "Service role can manage personality profiles"
  ON personality_profiles FOR ALL
  USING ((auth.jwt()->>'role') = 'service_role');

-- RLS Policies for personality_features
CREATE POLICY "Users can view own personality features"
  ON personality_features FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Merchants can view all personality features"
  ON personality_features FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('merchant', 'admin')
    )
  );

CREATE POLICY "Service role can manage personality features"
  ON personality_features FOR ALL
  USING ((auth.jwt()->>'role') = 'service_role');

-- Create indices for fast lookups
CREATE INDEX IF NOT EXISTS idx_personality_profiles_user_id ON personality_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_profiles_mbti_type ON personality_profiles(mbti_type);
CREATE INDEX IF NOT EXISTS idx_personality_features_user_id ON personality_features(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_features_time_window ON personality_features(time_window);

-- Add birthdate to user_profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'birthdate'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN birthdate DATE;
    CREATE INDEX idx_user_profiles_birthdate ON user_profiles(birthdate);
  END IF;
END $$;