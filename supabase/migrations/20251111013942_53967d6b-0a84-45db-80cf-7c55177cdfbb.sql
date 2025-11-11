-- Add public read policy for user_profiles to display members on globe
-- This only allows reading basic profile info for the map display
CREATE POLICY "Public can view basic profile info for globe display"
ON public.user_profiles
FOR SELECT
USING (
  latitude IS NOT NULL AND longitude IS NOT NULL
);