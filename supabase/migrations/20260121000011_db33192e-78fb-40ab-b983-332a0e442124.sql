-- First reset all users to offline
UPDATE user_profiles SET is_online = false;

-- Set 25 random members as online with recent activity
UPDATE user_profiles
SET 
  is_online = true,
  last_active_at = now() - (interval '1 minute' * floor(random() * 30))
WHERE id IN (
  SELECT id FROM user_profiles 
  WHERE display_name IS NOT NULL 
  AND avatar_url IS NOT NULL
  ORDER BY random() 
  LIMIT 25
);