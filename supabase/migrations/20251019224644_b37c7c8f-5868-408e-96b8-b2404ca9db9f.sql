-- Add latitude and longitude columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Create index for geo queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON public.user_profiles(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_coords ON public.user_profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create function to geocode location (this will be called by edge function)
CREATE OR REPLACE FUNCTION public.update_user_coordinates(
  p_user_id uuid,
  p_latitude numeric,
  p_longitude numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    latitude = p_latitude,
    longitude = p_longitude,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Enable realtime for user_profiles
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;