-- Add performance indexes for community member queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_online_status 
  ON public.user_profiles(is_online, last_active_at DESC) 
  WHERE is_online = true;

CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name 
  ON public.user_profiles(display_name);

CREATE INDEX IF NOT EXISTS idx_user_profiles_tier 
  ON public.user_profiles(tier);

CREATE INDEX IF NOT EXISTS idx_user_profiles_membership_tier 
  ON public.user_profiles(membership_tier);

CREATE INDEX IF NOT EXISTS idx_user_profiles_location 
  ON public.user_profiles(location);

-- Add index for pagination
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at 
  ON public.user_profiles(created_at DESC);