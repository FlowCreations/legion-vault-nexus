-- Make user_id nullable for Heartbeat-only members
ALTER TABLE user_profiles 
ALTER COLUMN user_id DROP NOT NULL;

-- Add index on heartbeat_member_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_heartbeat_member_id 
ON user_profiles(heartbeat_member_id);