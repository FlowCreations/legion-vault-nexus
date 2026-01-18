-- Standardize tier values in user_profiles
UPDATE user_profiles SET tier = 'Free' WHERE LOWER(tier) IN ('free', 'free member') OR tier IS NULL;
UPDATE user_profiles SET tier = 'Rebel' WHERE LOWER(tier) IN ('rebel', 'rebels');
UPDATE user_profiles SET tier = 'Outlaw' WHERE LOWER(tier) IN ('outlaw', 'outlaws');
UPDATE user_profiles SET tier = 'Legionnaire' WHERE LOWER(tier) IN ('legionnaire', 'legionnaires', 'legion', 'legion elite', 'legion vip', 'legion member');

-- Sync membership_tier column to match tier
UPDATE user_profiles SET membership_tier = tier WHERE membership_tier IS DISTINCT FROM tier;

-- Set 12 random members as online for demo purposes
UPDATE user_profiles 
SET is_online = true, last_active_at = now() 
WHERE id IN (
  SELECT id FROM user_profiles 
  WHERE tier IS NOT NULL 
  ORDER BY RANDOM() 
  LIMIT 12
);