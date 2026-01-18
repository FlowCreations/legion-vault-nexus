-- Performance indexes for user_profiles table
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON user_profiles(tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_membership_tier ON user_profiles(membership_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier_created ON user_profiles(tier, created_at DESC);

-- Index for milestone_progress lookups
CREATE INDEX IF NOT EXISTS idx_milestone_progress_user_id ON milestone_progress(user_id);