-- Create personality_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.personality_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  p_e DECIMAL(3,2) DEFAULT 0.5,
  p_i DECIMAL(3,2) DEFAULT 0.5,
  p_s DECIMAL(3,2) DEFAULT 0.5,
  p_n DECIMAL(3,2) DEFAULT 0.5,
  p_t DECIMAL(3,2) DEFAULT 0.5,
  p_f DECIMAL(3,2) DEFAULT 0.5,
  p_j DECIMAL(3,2) DEFAULT 0.5,
  p_p DECIMAL(3,2) DEFAULT 0.5,
  assertiveness DECIMAL(3,2) DEFAULT 0.5,
  mbti_type TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  survey_responses JSONB,
  feature_vector JSONB,
  last_computed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create personality_features table for behavioral data
CREATE TABLE IF NOT EXISTS public.personality_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  value DECIMAL(10,4),
  time_window TEXT CHECK (time_window IN ('24h', '7d', '28d', 'lifetime')),
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_name, time_window)
);

-- Enable RLS
ALTER TABLE public.personality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personality_profiles
CREATE POLICY "Users can view their own personality profile"
ON public.personality_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all personality profiles"
ON public.personality_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "System can insert personality profiles"
ON public.personality_profiles FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update personality profiles"
ON public.personality_profiles FOR UPDATE
USING (true);

-- RLS Policies for personality_features
CREATE POLICY "Admins can view all personality features"
ON public.personality_features FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "System can manage personality features"
ON public.personality_features FOR ALL
USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_personality_profiles_user_id ON public.personality_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_profiles_mbti_type ON public.personality_profiles(mbti_type);
CREATE INDEX IF NOT EXISTS idx_personality_features_user_id ON public.personality_features(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_features_time_window ON public.personality_features(time_window);
CREATE INDEX IF NOT EXISTS idx_next_best_actions_status ON public.next_best_actions(status);