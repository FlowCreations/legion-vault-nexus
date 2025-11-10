-- Create purchases table for tracking all purchase records
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  customer_name TEXT,
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  product_type TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  amount_total NUMERIC NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'completed',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases"
  ON public.purchases
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    email IN (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Merchants and admins can view all purchases
CREATE POLICY "Merchants can view all purchases"
  ON public.purchases
  FOR SELECT
  USING (
    has_role(auth.uid(), 'merchant'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Service role can manage all purchases
CREATE POLICY "Service role can manage purchases"
  ON public.purchases
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_stripe_session_id ON public.purchases(stripe_session_id);
CREATE INDEX idx_purchases_created_at ON public.purchases(created_at DESC);