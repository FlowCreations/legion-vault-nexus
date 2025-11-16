-- Create smart campaigns table
CREATE TABLE IF NOT EXISTS public.smart_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'event', -- event, product_launch, content_promotion
  event_location JSONB, -- {city, state, country, latitude, longitude}
  event_date TIMESTAMP WITH TIME ZONE,
  target_radius_miles INTEGER DEFAULT 120, -- 2 hour drive radius
  ptp_min NUMERIC DEFAULT 0.4, -- Yellow zone start
  ptp_max NUMERIC DEFAULT 1.0, -- Green zone end
  min_loyalty_score NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft, analyzing, ready, launched, completed
  ai_analysis JSONB, -- Stores AI reasoning and targeting breakdown
  target_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaign targets table (stores who was selected and why)
CREATE TABLE IF NOT EXISTS public.campaign_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.smart_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  targeting_reasons JSONB NOT NULL, -- {distance_miles, ptp_score, loyalty_score, location_match, etc}
  engagement_score NUMERIC,
  predicted_conversion_probability NUMERIC,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

-- Create campaign performance table
CREATE TABLE IF NOT EXISTS public.campaign_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.smart_campaigns(id) ON DELETE CASCADE,
  total_targeted INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  revenue_generated NUMERIC DEFAULT 0,
  location_breakdown JSONB, -- {within_2h: 178, loyal_fans: 58, etc}
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id)
);

-- Enable RLS
ALTER TABLE public.smart_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for smart_campaigns
CREATE POLICY "Users can view their own campaigns"
  ON public.smart_campaigns FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create campaigns"
  ON public.smart_campaigns FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own campaigns"
  ON public.smart_campaigns FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own campaigns"
  ON public.smart_campaigns FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for campaign_targets
CREATE POLICY "Campaign creators can view targets"
  ON public.campaign_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.smart_campaigns
      WHERE id = campaign_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "System can insert targets"
  ON public.campaign_targets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update targets"
  ON public.campaign_targets FOR UPDATE
  USING (true);

-- RLS Policies for campaign_performance
CREATE POLICY "Campaign creators can view performance"
  ON public.campaign_performance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.smart_campaigns
      WHERE id = campaign_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "System can manage performance"
  ON public.campaign_performance FOR ALL
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_smart_campaigns_created_by ON public.smart_campaigns(created_by);
CREATE INDEX idx_smart_campaigns_status ON public.smart_campaigns(status);
CREATE INDEX idx_campaign_targets_campaign_id ON public.campaign_targets(campaign_id);
CREATE INDEX idx_campaign_targets_user_id ON public.campaign_targets(user_id);
CREATE INDEX idx_campaign_performance_campaign_id ON public.campaign_performance(campaign_id);

-- Create function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION public.calculate_distance_miles(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R NUMERIC := 3959; -- Earth's radius in miles
  dLat NUMERIC;
  dLon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_smart_campaigns_updated_at
  BEFORE UPDATE ON public.smart_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_performance_updated_at
  BEFORE UPDATE ON public.campaign_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();