-- Add heartbeat_member_id to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS heartbeat_member_id TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_heartbeat_member_id 
ON user_profiles(heartbeat_member_id) 
WHERE heartbeat_member_id IS NOT NULL;