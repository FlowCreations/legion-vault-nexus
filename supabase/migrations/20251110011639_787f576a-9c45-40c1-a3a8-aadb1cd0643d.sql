-- Create email_verifications table for custom verification tokens
CREATE TABLE public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Create index for faster token lookups
CREATE INDEX idx_email_verifications_token ON public.email_verifications(token);
CREATE INDEX idx_email_verifications_user_id ON public.email_verifications(user_id);

-- RLS Policies
CREATE POLICY "Users can view their own verification records"
  ON public.email_verifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage verifications"
  ON public.email_verifications
  FOR ALL
  USING (true)
  WITH CHECK (true);