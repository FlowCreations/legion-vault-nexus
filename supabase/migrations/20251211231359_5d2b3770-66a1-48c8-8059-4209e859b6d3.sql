
-- Create fan_affiliates table
CREATE TABLE public.fan_affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL UNIQUE,
  shopify_discount_code TEXT,
  shopify_price_rule_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  total_clicks INTEGER NOT NULL DEFAULT 0,
  portal_signups INTEGER NOT NULL DEFAULT 0,
  digital_purchases INTEGER NOT NULL DEFAULT 0,
  merch_purchases INTEGER NOT NULL DEFAULT 0,
  discount_codes_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate_referral_clicks table
CREATE TABLE public.affiliate_referral_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.fan_affiliates(id) ON DELETE CASCADE,
  visitor_jrny_id TEXT,
  visitor_session_id TEXT,
  link_type TEXT NOT NULL CHECK (link_type IN ('portal', 'music', 'merch')),
  source_platform TEXT,
  landing_page TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  converted BOOLEAN NOT NULL DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate_rewards table
CREATE TABLE public.affiliate_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.fan_affiliates(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('signup', 'digital_purchase', 'subscription', 'merch_purchase')),
  discount_code TEXT NOT NULL,
  discount_percentage INTEGER NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'shopify_code' CHECK (reward_type IN ('portal_credit', 'shopify_code')),
  shopify_price_rule_id TEXT,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_fan_affiliates_user_id ON public.fan_affiliates(user_id);
CREATE INDEX idx_fan_affiliates_code ON public.fan_affiliates(affiliate_code);
CREATE INDEX idx_affiliate_clicks_affiliate_id ON public.affiliate_referral_clicks(affiliate_id);
CREATE INDEX idx_affiliate_clicks_jrny_id ON public.affiliate_referral_clicks(visitor_jrny_id);
CREATE INDEX idx_affiliate_rewards_affiliate_id ON public.affiliate_rewards(affiliate_id);

-- Enable RLS
ALTER TABLE public.fan_affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fan_affiliates
CREATE POLICY "Users can view their own affiliate data"
  ON public.fan_affiliates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own affiliate"
  ON public.fan_affiliates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate"
  ON public.fan_affiliates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Merchants can view all affiliates"
  ON public.fan_affiliates FOR SELECT
  USING (has_role(auth.uid(), 'merchant') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage affiliates"
  ON public.fan_affiliates FOR ALL
  USING (true);

-- RLS Policies for affiliate_referral_clicks
CREATE POLICY "Anyone can insert clicks"
  ON public.affiliate_referral_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Affiliates can view their own clicks"
  ON public.affiliate_referral_clicks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.fan_affiliates 
    WHERE fan_affiliates.id = affiliate_referral_clicks.affiliate_id 
    AND fan_affiliates.user_id = auth.uid()
  ));

CREATE POLICY "Merchants can view all clicks"
  ON public.affiliate_referral_clicks FOR SELECT
  USING (has_role(auth.uid(), 'merchant') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage clicks"
  ON public.affiliate_referral_clicks FOR ALL
  USING (true);

-- RLS Policies for affiliate_rewards
CREATE POLICY "Affiliates can view their own rewards"
  ON public.affiliate_rewards FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.fan_affiliates 
    WHERE fan_affiliates.id = affiliate_rewards.affiliate_id 
    AND fan_affiliates.user_id = auth.uid()
  ));

CREATE POLICY "Merchants can view all rewards"
  ON public.affiliate_rewards FOR SELECT
  USING (has_role(auth.uid(), 'merchant') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage rewards"
  ON public.affiliate_rewards FOR ALL
  USING (true);

-- Function to generate unique affiliate code
CREATE OR REPLACE FUNCTION generate_affiliate_code(display_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_code TEXT;
  random_suffix TEXT;
  full_code TEXT;
  attempts INTEGER := 0;
BEGIN
  -- Create base from first 4 chars of name (uppercase, alphanumeric only)
  base_code := UPPER(REGEXP_REPLACE(COALESCE(display_name, 'FAN'), '[^A-Za-z0-9]', '', 'g'));
  base_code := LEFT(base_code, 4);
  IF LENGTH(base_code) < 2 THEN
    base_code := 'FAN';
  END IF;
  
  -- Keep trying until we find a unique code
  LOOP
    random_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    full_code := base_code || random_suffix;
    
    -- Check if code exists
    IF NOT EXISTS (SELECT 1 FROM public.fan_affiliates WHERE affiliate_code = full_code) THEN
      RETURN full_code;
    END IF;
    
    attempts := attempts + 1;
    IF attempts > 100 THEN
      -- Fallback to UUID-based code
      RETURN 'SOL' || UPPER(LEFT(REPLACE(gen_random_uuid()::TEXT, '-', ''), 5));
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE TRIGGER update_fan_affiliates_updated_at
  BEFORE UPDATE ON public.fan_affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
