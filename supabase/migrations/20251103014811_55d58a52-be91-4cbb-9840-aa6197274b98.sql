-- Update the grant_admin_role_on_signup function to include both arock and sookz
CREATE OR REPLACE FUNCTION public.grant_admin_role_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Grant admin role to arock@sonsoflegion.com and sookz@me.com
  IF NEW.email IN ('arock@sonsoflegion.com', 'sookz@me.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Manually grant admin role to sookz if they already exist
DO $$
DECLARE
  sookz_user_id uuid;
BEGIN
  -- Get sookz user ID
  SELECT id INTO sookz_user_id
  FROM auth.users
  WHERE email = 'sookz@me.com'
  LIMIT 1;
  
  -- If user exists, grant admin role
  IF sookz_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (sookz_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;