-- Create avatar_archetypes table to store AI-generated member personas
CREATE TABLE IF NOT EXISTS avatar_archetypes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_name text NOT NULL,
  description text,
  confidence_score numeric DEFAULT 0,
  member_count integer DEFAULT 0,
  
  -- Core Demographic
  core_demographic jsonb DEFAULT '{}'::jsonb,
  
  -- Psychographic & Personality
  psychographic_personality jsonb DEFAULT '{}'::jsonb,
  
  -- Behavioral Patterns
  behavioral_patterns jsonb DEFAULT '{}'::jsonb,
  
  -- Emotional & Energy Profile
  emotional_energy_profile jsonb DEFAULT '{}'::jsonb,
  
  -- Cultural & Symbolic Affinities
  cultural_symbolic_affinities jsonb DEFAULT '{}'::jsonb,
  
  -- Socioeconomic Context
  socioeconomic_context jsonb DEFAULT '{}'::jsonb,
  
  -- Experiential & Aspirational
  experiential_aspirational jsonb DEFAULT '{}'::jsonb,
  
  -- Predictive Signals
  predictive_signals jsonb DEFAULT '{}'::jsonb,
  
  -- Conversion Predictions
  conversion_predictions jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE avatar_archetypes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Merchants can view avatars"
  ON avatar_archetypes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('merchant', 'admin')
    )
  );

CREATE POLICY "Service role can manage avatars"
  ON avatar_archetypes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add index for performance
CREATE INDEX idx_avatar_archetypes_updated ON avatar_archetypes(updated_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_avatar_archetypes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER avatar_archetypes_updated_at
  BEFORE UPDATE ON avatar_archetypes
  FOR EACH ROW
  EXECUTE FUNCTION update_avatar_archetypes_updated_at();