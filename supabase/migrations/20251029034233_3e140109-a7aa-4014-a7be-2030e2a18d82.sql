-- Enable RLS on feature_flags if not already enabled
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Authenticated users can update feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Authenticated users can insert feature flags" ON public.feature_flags;

-- Create policies for feature_flags
CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update feature flags"
  ON public.feature_flags
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert feature flags"
  ON public.feature_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert initial feature flags
INSERT INTO public.feature_flags (flag_name, enabled)
VALUES 
  ('auto_engage_fans', false),
  ('flow_leader_active', false)
ON CONFLICT (flag_name) DO NOTHING;