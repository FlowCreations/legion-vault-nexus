-- Create function to set up user profile and analytics on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create user profile with default analytics values
  INSERT INTO public.user_profiles (
    user_id,
    email,
    watch_time,
    listen_time,
    last_login,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    0,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Initialize user analytics record
  INSERT INTO public.user_analytics (
    user_id,
    total_visits,
    last_activity
  )
  VALUES (
    NEW.id,
    0,
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger to run on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();