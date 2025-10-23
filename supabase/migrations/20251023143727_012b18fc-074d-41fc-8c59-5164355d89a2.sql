-- Create feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name text UNIQUE NOT NULL,
  enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert cameo feature flag
INSERT INTO feature_flags (flag_name, enabled) 
VALUES ('enable_cameo_booking', false)
ON CONFLICT (flag_name) DO NOTHING;

-- RLS policies for feature flags
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view feature flags" ON feature_flags;
CREATE POLICY "Anyone can view feature flags"
ON feature_flags FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "Only admins can manage feature flags" ON feature_flags;
CREATE POLICY "Only admins can manage feature flags"
ON feature_flags FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create cameo requests table
CREATE TABLE IF NOT EXISTS cameo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid,
  requester_email text NOT NULL,
  recipient_name text NOT NULL,
  occasion_type text NOT NULL,
  special_instructions text,
  requested_delivery_date timestamp with time zone,
  price_paid numeric NOT NULL DEFAULT 100,
  payment_status text NOT NULL DEFAULT 'pending',
  stripe_payment_id text,
  stripe_checkout_session_id text,
  fulfillment_status text NOT NULL DEFAULT 'pending',
  completed_cameo_id uuid REFERENCES cameos(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS policies for cameo requests
ALTER TABLE cameo_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own requests" ON cameo_requests;
CREATE POLICY "Users can view their own requests"
ON cameo_requests FOR SELECT
TO authenticated
USING (requester_user_id = auth.uid() OR has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can create cameo requests" ON cameo_requests;
CREATE POLICY "Anyone can create cameo requests"
ON cameo_requests FOR INSERT
TO authenticated, anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Merchants can update requests" ON cameo_requests;
CREATE POLICY "Merchants can update requests"
ON cameo_requests FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Update user_profiles for presence tracking
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_online ON user_profiles(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active ON user_profiles(last_active_at);
CREATE INDEX IF NOT EXISTS idx_cameo_requests_fulfillment ON cameo_requests(fulfillment_status, payment_status);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_cameo_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cameo_requests_updated_at ON cameo_requests;
CREATE TRIGGER update_cameo_requests_updated_at
BEFORE UPDATE ON cameo_requests
FOR EACH ROW
EXECUTE FUNCTION update_cameo_requests_updated_at();

DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON feature_flags
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();