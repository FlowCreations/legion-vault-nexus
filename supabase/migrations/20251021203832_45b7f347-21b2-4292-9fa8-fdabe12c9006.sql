-- Create affiliates table for artist affiliates
CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  ethos TEXT,
  non_negotiables TEXT[],
  social_links JSONB DEFAULT '{}',
  analytics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brand partnerships table
CREATE TABLE public.brand_partnerships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  brand_name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  website_url TEXT,
  content JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate content table (for "you might also like")
CREATE TABLE public.affiliate_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  content_type TEXT,
  content_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ethos requests table (for sending/receiving ethos)
CREATE TABLE public.ethos_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_artist_id UUID NOT NULL,
  to_artist_id UUID NOT NULL,
  ethos TEXT NOT NULL,
  non_negotiables TEXT[],
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ethos_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliates
CREATE POLICY "Merchants can manage their affiliates"
ON public.affiliates
FOR ALL
USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Affiliates viewable by everyone"
ON public.affiliates
FOR SELECT
USING (true);

-- RLS Policies for brand partnerships
CREATE POLICY "Merchants can manage their brand partnerships"
ON public.brand_partnerships
FOR ALL
USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brand partnerships viewable by everyone"
ON public.brand_partnerships
FOR SELECT
USING (true);

-- RLS Policies for affiliate content
CREATE POLICY "Merchants can manage affiliate content"
ON public.affiliate_content
FOR ALL
USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Affiliate content viewable by everyone"
ON public.affiliate_content
FOR SELECT
USING (true);

-- RLS Policies for ethos requests
CREATE POLICY "Merchants can manage ethos requests"
ON public.ethos_requests
FOR ALL
USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Ethos requests viewable by involved parties"
ON public.ethos_requests
FOR SELECT
USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));