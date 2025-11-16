-- PART 1: DATABASE FOUNDATION FOR AI MARKETING AUTOMATION

-- 1. Create marketing_campaigns table
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  goal TEXT NOT NULL,
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_date DATE NOT NULL,
  budget_tier TEXT NOT NULL DEFAULT 'moderate' CHECK (budget_tier IN ('minimal', 'moderate', 'aggressive')),
  enabled_channels JSONB NOT NULL DEFAULT '{"email": true, "sms": false, "inbox": false, "popup": false}'::jsonb,
  target_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'analyzing', 'active', 'paused', 'completed', 'failed')),
  performance_metrics JSONB DEFAULT '{"sent": 0, "opened": 0, "clicked": 0, "converted": 0, "revenue": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for marketing_campaigns
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies for marketing_campaigns
CREATE POLICY "Merchants can manage their own campaigns"
  ON public.marketing_campaigns
  FOR ALL
  USING (merchant_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- 2. Create campaign_targets table
CREATE TABLE IF NOT EXISTS public.campaign_targets_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  ptp_score INTEGER NOT NULL CHECK (ptp_score >= 0 AND ptp_score <= 100),
  ptp_status TEXT NOT NULL CHECK (ptp_status IN ('red', 'yellow', 'green')),
  personalization_data JSONB DEFAULT '{}'::jsonb,
  message_sent_at TIMESTAMP WITH TIME ZONE,
  message_opened_at TIMESTAMP WITH TIME ZONE,
  message_clicked_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  revenue_generated NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for campaign_targets_v2
ALTER TABLE public.campaign_targets_v2 ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_targets_v2
CREATE POLICY "Merchants can view their campaign targets"
  ON public.campaign_targets_v2
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.marketing_campaigns 
      WHERE merchant_id = auth.uid() OR has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "System can manage campaign targets"
  ON public.campaign_targets_v2
  FOR ALL
  USING (true);

-- 3. Create campaign_message_log table
CREATE TABLE IF NOT EXISTS public.campaign_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'inbox', 'popup')),
  message_content JSONB NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for campaign_message_log
ALTER TABLE public.campaign_message_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_message_log
CREATE POLICY "Merchants can view their campaign messages"
  ON public.campaign_message_log
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.marketing_campaigns 
      WHERE merchant_id = auth.uid() OR has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "System can manage campaign messages"
  ON public.campaign_message_log
  FOR ALL
  USING (true);

-- 4. Add PTP columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS ptp_score INTEGER DEFAULT 0 CHECK (ptp_score >= 0 AND ptp_score <= 100),
ADD COLUMN IF NOT EXISTS ptp_status TEXT DEFAULT 'red' CHECK (ptp_status IN ('red', 'yellow', 'green')),
ADD COLUMN IF NOT EXISTS last_ptp_calculation TIMESTAMP WITH TIME ZONE;

-- 5. Create ptp_score_history table
CREATE TABLE IF NOT EXISTS public.ptp_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  status TEXT NOT NULL CHECK (status IN ('red', 'yellow', 'green')),
  contributing_factors JSONB DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for ptp_score_history
ALTER TABLE public.ptp_score_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for ptp_score_history
CREATE POLICY "Users can view their own PTP history"
  ON public.ptp_score_history
  FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'merchant') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage PTP history"
  ON public.ptp_score_history
  FOR ALL
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_merchant ON public.marketing_campaigns(merchant_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_targets_v2_campaign ON public.campaign_targets_v2(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_targets_v2_user ON public.campaign_targets_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_targets_v2_ptp_status ON public.campaign_targets_v2(ptp_status);
CREATE INDEX IF NOT EXISTS idx_campaign_message_log_campaign ON public.campaign_message_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_message_log_user ON public.campaign_message_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ptp_score_history_user ON public.ptp_score_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_ptp_status ON public.user_profiles(ptp_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_ptp_score ON public.user_profiles(ptp_score);