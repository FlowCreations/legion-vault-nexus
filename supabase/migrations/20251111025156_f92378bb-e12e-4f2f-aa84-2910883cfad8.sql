-- Create abandoned_carts table to track abandoned shopping carts
CREATE TABLE public.abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id),
  cart_items JSONB NOT NULL,
  cart_value DECIMAL(10,2),
  discount_code TEXT,
  discount_percentage INT DEFAULT 25,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'recovered', 'expired', 'ignored')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent_at TIMESTAMP WITH TIME ZONE,
  recovered_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Create shopify_discount_codes table to track generated discount codes
CREATE TABLE public.shopify_discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_percentage INT NOT NULL,
  abandoned_cart_id UUID REFERENCES public.abandoned_carts(id),
  shopify_price_rule_id TEXT,
  shopify_discount_id TEXT,
  valid_until TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart_sessions table to track cart state from frontend
CREATE TABLE public.cart_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id),
  session_id TEXT,
  cart_items JSONB NOT NULL,
  cart_value DECIMAL(10,2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on abandoned_carts
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Users can view their own abandoned carts
CREATE POLICY "Users can view their own abandoned carts"
  ON public.abandoned_carts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage abandoned carts
CREATE POLICY "Service role can manage abandoned carts"
  ON public.abandoned_carts
  FOR ALL
  USING (true);

-- Enable RLS on shopify_discount_codes
ALTER TABLE public.shopify_discount_codes ENABLE ROW LEVEL SECURITY;

-- Users can view discount codes for their abandoned carts
CREATE POLICY "Users can view their discount codes"
  ON public.shopify_discount_codes
  FOR SELECT
  USING (abandoned_cart_id IN (
    SELECT id FROM public.abandoned_carts WHERE user_id = auth.uid()
  ));

-- Service role can manage discount codes
CREATE POLICY "Service role can manage discount codes"
  ON public.shopify_discount_codes
  FOR ALL
  USING (true);

-- Enable RLS on cart_sessions
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own cart sessions
CREATE POLICY "Users can manage their own cart sessions"
  ON public.cart_sessions
  FOR ALL
  USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Add feature flag for abandoned cart recovery
INSERT INTO public.feature_flags (flag_name, enabled)
VALUES ('abandoned_cart_recovery_enabled', true)
ON CONFLICT (flag_name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_abandoned_carts_user_status ON public.abandoned_carts(user_id, status);
CREATE INDEX idx_cart_sessions_user_updated ON public.cart_sessions(user_id, last_updated);
CREATE INDEX idx_shopify_codes_cart ON public.shopify_discount_codes(abandoned_cart_id);