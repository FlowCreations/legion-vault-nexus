-- Create social_credentials table for storing metadata about configured social credentials
CREATE TABLE IF NOT EXISTS public.social_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'instagram', 'tiktok', 'twitter')),
  credential_type TEXT NOT NULL CHECK (credential_type IN ('pixel_id', 'access_token', 'account_id')),
  is_configured BOOLEAN NOT NULL DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'not_configured' CHECK (status IN ('active', 'invalid', 'not_configured')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform, credential_type)
);

-- Create index for faster lookups
CREATE INDEX idx_social_credentials_user_platform ON public.social_credentials(user_id, platform);

-- Enable RLS
ALTER TABLE public.social_credentials ENABLE ROW LEVEL SECURITY;

-- Users can view their own credentials
CREATE POLICY "Users can view their own social credentials"
  ON public.social_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own credentials
CREATE POLICY "Users can insert their own social credentials"
  ON public.social_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own credentials
CREATE POLICY "Users can update their own social credentials"
  ON public.social_credentials
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own credentials
CREATE POLICY "Users can delete their own social credentials"
  ON public.social_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all credentials
CREATE POLICY "Admins can view all social credentials"
  ON public.social_credentials
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updating updated_at
CREATE TRIGGER update_social_credentials_updated_at
  BEFORE UPDATE ON public.social_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();