-- Update the admin auto-grant function to include adam.kravemedia@gmail.com
CREATE OR REPLACE FUNCTION public.grant_admin_role_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Grant admin role to arock@sonsoflegion.com, sookz@me.com, and adam.kravemedia@gmail.com
  IF NEW.email IN ('arock@sonsoflegion.com', 'sookz@me.com', 'adam.kravemedia@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;