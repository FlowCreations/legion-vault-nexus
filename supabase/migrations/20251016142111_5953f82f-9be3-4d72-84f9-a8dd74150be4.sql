-- Fix 1: Update has_role function to use fully qualified table names and secure search_path
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;

CREATE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Recreate the policies that depend on has_role
DROP POLICY IF EXISTS "Admins and merchants can view all roles" ON public.user_roles;
CREATE POLICY "Admins and merchants can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'merchant'::app_role));

DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Merchants and admins can view all events" ON public.user_events;
CREATE POLICY "Merchants and admins can view all events"
ON public.user_events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'merchant'::app_role));

DROP POLICY IF EXISTS "Merchants and admins can view all analytics" ON public.user_analytics;
CREATE POLICY "Merchants and admins can view all analytics"
ON public.user_analytics
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'merchant'::app_role));

-- Fix 2: Update user_events RLS INSERT policy to prevent analytics manipulation
DROP POLICY IF EXISTS "Anyone can insert their own events" ON public.user_events;
DROP POLICY IF EXISTS "Users can insert their own events" ON public.user_events;

CREATE POLICY "Users can insert their own events"
ON public.user_events
FOR INSERT
WITH CHECK (
  user_id = auth.uid() OR (user_id IS NULL AND auth.uid() IS NULL)
);