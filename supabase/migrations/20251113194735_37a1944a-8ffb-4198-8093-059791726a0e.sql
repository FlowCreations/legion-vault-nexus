-- Create table to track email asset uploads
CREATE TABLE IF NOT EXISTS public.email_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  width integer,
  height integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_assets ENABLE ROW LEVEL SECURITY;

-- Policies for email_assets
CREATE POLICY "Users can view their own assets"
  ON public.email_assets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets"
  ON public.email_assets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets"
  ON public.email_assets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_email_assets_user_id ON public.email_assets(user_id);
CREATE INDEX idx_email_assets_created_at ON public.email_assets(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_email_assets_updated_at
  BEFORE UPDATE ON public.email_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();