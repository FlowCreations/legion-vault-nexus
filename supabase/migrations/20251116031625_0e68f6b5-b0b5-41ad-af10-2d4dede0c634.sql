-- Create table for portal connections
CREATE TABLE IF NOT EXISTS public.portal_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_artist_id UUID NOT NULL,
  partner_artist_id UUID NOT NULL,
  partner_name TEXT NOT NULL,
  partner_bio TEXT,
  partner_avatar_url TEXT,
  special_offer TEXT,
  offer_duration_days INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'active',
  analytics JSONB DEFAULT '{"fans_joined": 0, "affiliate_revenue": 0, "retention_rate": 0, "engagement_score": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  disconnected_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(host_artist_id, partner_artist_id)
);

-- Enable RLS
ALTER TABLE public.portal_connections ENABLE ROW LEVEL SECURITY;

-- Policy for merchants to manage their portal connections
CREATE POLICY "Merchants can manage their portal connections"
ON public.portal_connections
FOR ALL
USING (
  has_role(auth.uid(), 'merchant'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Policy for users to view active portal connections
CREATE POLICY "Users can view active portal connections"
ON public.portal_connections
FOR SELECT
USING (status = 'active');

-- Create index for faster queries
CREATE INDEX idx_portal_connections_host ON public.portal_connections(host_artist_id);
CREATE INDEX idx_portal_connections_status ON public.portal_connections(status);