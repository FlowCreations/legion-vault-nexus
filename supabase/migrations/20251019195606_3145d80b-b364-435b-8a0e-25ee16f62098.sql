-- Add private profile fields
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS real_name TEXT,
ADD COLUMN IF NOT EXISTS birthdate DATE,
ADD COLUMN IF NOT EXISTS gender TEXT;

COMMENT ON COLUMN public.user_profiles.real_name IS 'Private: Real name (not displayed publicly)';
COMMENT ON COLUMN public.user_profiles.birthdate IS 'Private: Used for birthday cards, not public';
COMMENT ON COLUMN public.user_profiles.gender IS 'Private: For demographics, not public';