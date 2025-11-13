-- Create automation_rules table for trigger-based email campaigns
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'ptp_score', 'era_label', 'abandoned_cart', 'video_watch', 'behavior_pattern'
  trigger_conditions JSONB NOT NULL DEFAULT '{}', -- e.g., {"ptp_min": 67, "era_label": "Invest"}
  action_type TEXT NOT NULL, -- 'send_email', 'add_to_list', 'trigger_webhook'
  action_config JSONB NOT NULL DEFAULT '{}', -- email template, list ID, etc.
  priority INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  max_sends_per_user INTEGER DEFAULT 1,
  cooldown_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create automation_rule_executions table for tracking
CREATE TABLE IF NOT EXISTS public.automation_rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'sent', -- 'sent', 'opened', 'clicked', 'converted'
  metadata JSONB DEFAULT '{}',
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  conversion_value NUMERIC DEFAULT 0
);

-- Create email_recommendations table for AI suggestions
CREATE TABLE IF NOT EXISTS public.email_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL, -- 'discount_offer', 'content_suggestion', 're_engagement', 'vip_upgrade'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  suggested_action JSONB NOT NULL DEFAULT '{}', -- campaign template, discount code, etc.
  confidence_score NUMERIC DEFAULT 0,
  ptp_score INTEGER,
  era_label TEXT,
  behavioral_triggers JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending', -- 'pending', 'applied', 'dismissed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- Add new columns to email_campaigns for enhanced functionality
ALTER TABLE public.email_campaigns 
  ADD COLUMN IF NOT EXISTS send_immediately BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS objective TEXT, -- 'engagement', 'conversion', 'retention', 'reactivation'
  ADD COLUMN IF NOT EXISTS target_segment JSONB DEFAULT '{}'; -- PTP/ERA targeting

-- Enable RLS on new tables
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rule_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_rules
CREATE POLICY "Merchants can manage automation rules"
  ON public.automation_rules
  FOR ALL
  USING (
    has_role(auth.uid(), 'merchant'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for automation_rule_executions
CREATE POLICY "Merchants can view rule executions"
  ON public.automation_rule_executions
  FOR SELECT
  USING (
    has_role(auth.uid(), 'merchant'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Service role can manage rule executions"
  ON public.automation_rule_executions
  FOR ALL
  USING (true);

-- RLS Policies for email_recommendations
CREATE POLICY "Merchants can view recommendations"
  ON public.email_recommendations
  FOR SELECT
  USING (
    has_role(auth.uid(), 'merchant'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Service role can manage recommendations"
  ON public.email_recommendations
  FOR ALL
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON public.automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_rule_executions_user ON public.automation_rule_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_rule_executions_rule ON public.automation_rule_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_email_recommendations_user ON public.email_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_email_recommendations_status ON public.email_recommendations(status);

-- Create updated_at trigger for automation_rules
CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();