-- Create artist partnerships table for cross-platform affiliate system
CREATE TABLE public.artist_partnerships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  partner_artist_id UUID NOT NULL,
  partnership_type TEXT DEFAULT 'affiliate',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(artist_id, partner_artist_id)
);

-- Enable RLS
ALTER TABLE public.artist_partnerships ENABLE ROW LEVEL SECURITY;

-- Merchants and admins can view all partnerships
CREATE POLICY "Merchants and admins can view partnerships"
ON public.artist_partnerships
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'merchant'::app_role));

-- Merchants can manage partnerships
CREATE POLICY "Merchants can manage partnerships"
ON public.artist_partnerships
FOR ALL
USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create distributor integrations table for royalty tracking
CREATE TABLE public.distributor_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL,
  distributor_name TEXT NOT NULL,
  api_credentials JSONB,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.distributor_integrations ENABLE ROW LEVEL SECURITY;

-- Merchants can manage their own integrations
CREATE POLICY "Merchants can manage their integrations"
ON public.distributor_integrations
FOR ALL
USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create streaming stats table
CREATE TABLE public.streaming_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL,
  platform TEXT NOT NULL,
  streams INTEGER DEFAULT 0,
  estimated_revenue NUMERIC DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.streaming_stats ENABLE ROW LEVEL SECURITY;

-- Merchants can view their stats
CREATE POLICY "Merchants can view their stats"
ON public.streaming_stats
FOR SELECT
USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- System can insert stats
CREATE POLICY "System can insert stats"
ON public.streaming_stats
FOR INSERT
WITH CHECK (true);