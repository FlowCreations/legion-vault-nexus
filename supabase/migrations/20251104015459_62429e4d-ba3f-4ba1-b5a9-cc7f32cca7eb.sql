-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_membership_tier ON user_profiles(membership_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active_at ON user_profiles(last_active_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier_active ON user_profiles(membership_tier, last_active_at);

-- Optimize community_analytics table
CREATE TABLE IF NOT EXISTS community_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_members INTEGER NOT NULL DEFAULT 0,
  active_members_7d INTEGER NOT NULL DEFAULT 0,
  active_members_30d INTEGER NOT NULL DEFAULT 0,
  new_members_today INTEGER NOT NULL DEFAULT 0,
  tier_free INTEGER NOT NULL DEFAULT 0,
  tier_rebel INTEGER NOT NULL DEFAULT 0,
  tier_outlaw INTEGER NOT NULL DEFAULT 0,
  tier_legionnaire INTEGER NOT NULL DEFAULT 0,
  total_mrr DECIMAL(10,2) NOT NULL DEFAULT 0,
  avg_ltv DECIMAL(10,2) NOT NULL DEFAULT 0,
  top_country TEXT,
  top_region TEXT,
  countries_count INTEGER NOT NULL DEFAULT 0,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create function to compute analytics efficiently
CREATE OR REPLACE FUNCTION compute_community_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_members INTEGER;
  v_active_7d INTEGER;
  v_active_30d INTEGER;
  v_new_today INTEGER;
  v_tier_free INTEGER;
  v_tier_rebel INTEGER;
  v_tier_outlaw INTEGER;
  v_tier_legionnaire INTEGER;
  v_top_country TEXT;
  v_top_region TEXT;
  v_countries_count INTEGER;
BEGIN
  -- Count total members
  SELECT COUNT(*) INTO v_total_members FROM user_profiles;
  
  -- Count active members (7 days)
  SELECT COUNT(*) INTO v_active_7d 
  FROM user_profiles 
  WHERE last_active_at >= NOW() - INTERVAL '7 days';
  
  -- Count active members (30 days)
  SELECT COUNT(*) INTO v_active_30d 
  FROM user_profiles 
  WHERE last_active_at >= NOW() - INTERVAL '30 days';
  
  -- Count new members today
  SELECT COUNT(*) INTO v_new_today 
  FROM user_profiles 
  WHERE created_at >= CURRENT_DATE;
  
  -- Count by tier (case-insensitive)
  SELECT COUNT(*) INTO v_tier_free 
  FROM user_profiles 
  WHERE LOWER(COALESCE(membership_tier, tier, 'free')) LIKE '%free%';
  
  SELECT COUNT(*) INTO v_tier_rebel 
  FROM user_profiles 
  WHERE LOWER(COALESCE(membership_tier, tier, '')) LIKE '%rebel%';
  
  SELECT COUNT(*) INTO v_tier_outlaw 
  FROM user_profiles 
  WHERE LOWER(COALESCE(membership_tier, tier, '')) LIKE '%outlaw%';
  
  SELECT COUNT(*) INTO v_tier_legionnaire 
  FROM user_profiles 
  WHERE LOWER(COALESCE(membership_tier, tier, '')) LIKE '%legionnaire%';
  
  -- Get top country
  SELECT country INTO v_top_country
  FROM user_profiles 
  WHERE country IS NOT NULL 
  GROUP BY country 
  ORDER BY COUNT(*) DESC 
  LIMIT 1;
  
  -- Get top region
  SELECT region INTO v_top_region
  FROM user_profiles 
  WHERE region IS NOT NULL 
  GROUP BY region 
  ORDER BY COUNT(*) DESC 
  LIMIT 1;
  
  -- Count unique countries
  SELECT COUNT(DISTINCT country) INTO v_countries_count 
  FROM user_profiles 
  WHERE country IS NOT NULL;
  
  -- Insert or update analytics
  INSERT INTO community_analytics (
    id,
    total_members,
    active_members_7d,
    active_members_30d,
    new_members_today,
    tier_free,
    tier_rebel,
    tier_outlaw,
    tier_legionnaire,
    top_country,
    top_region,
    countries_count,
    computed_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    v_total_members,
    v_active_7d,
    v_active_30d,
    v_new_today,
    v_tier_free,
    v_tier_rebel,
    v_tier_outlaw,
    v_tier_legionnaire,
    v_top_country,
    v_top_region,
    v_countries_count,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    total_members = v_total_members,
    active_members_7d = v_active_7d,
    active_members_30d = v_active_30d,
    new_members_today = v_new_today,
    tier_free = v_tier_free,
    tier_rebel = v_tier_rebel,
    tier_outlaw = v_tier_outlaw,
    tier_legionnaire = v_tier_legionnaire,
    top_country = v_top_country,
    top_region = v_top_region,
    countries_count = v_countries_count,
    computed_at = NOW(),
    updated_at = NOW();
END;
$$;