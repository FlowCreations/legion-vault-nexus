-- Email Marketing Tables

-- Email Lists (Segments)
CREATE TABLE IF NOT EXISTS public.email_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  filter_rules JSONB NOT NULL DEFAULT '{}',
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Email Campaigns
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  preview_text TEXT,
  email_body TEXT NOT NULL,
  list_id UUID REFERENCES public.email_lists(id) ON DELETE SET NULL,
  campaign_type TEXT DEFAULT 'broadcast' CHECK (campaign_type IN ('broadcast', 'automated')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Email Templates (React Email)
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  template_code TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Email Sends (Tracking)
CREATE TABLE IF NOT EXISTS public.email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  user_id UUID,
  email_address TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  bounced BOOLEAN DEFAULT false,
  bounce_reason TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Automation Sequences
CREATE TABLE IF NOT EXISTS public.automation_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('ptp_threshold', 'cart_abandoned', 'signup', 'purchase_milestone', 'geographic_event', 'manual')),
  trigger_rules JSONB NOT NULL DEFAULT '{}',
  steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.email_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_sequences ENABLE ROW LEVEL SECURITY;

-- Merchants and admins can manage email lists
CREATE POLICY "Merchants can manage email lists"
  ON public.email_lists
  FOR ALL
  USING (has_role(auth.uid(), 'merchant') OR has_role(auth.uid(), 'admin'));

-- Merchants and admins can manage campaigns
CREATE POLICY "Merchants can manage campaigns"
  ON public.email_campaigns
  FOR ALL
  USING (has_role(auth.uid(), 'merchant') OR has_role(auth.uid(), 'admin'));

-- Everyone can view templates
CREATE POLICY "Templates viewable by everyone"
  ON public.email_templates
  FOR SELECT
  USING (true);

-- Merchants can manage templates
CREATE POLICY "Merchants can manage templates"
  ON public.email_templates
  FOR ALL
  USING (has_role(auth.uid(), 'merchant') OR has_role(auth.uid(), 'admin'));

-- Merchants can view email sends
CREATE POLICY "Merchants can view email sends"
  ON public.email_sends
  FOR SELECT
  USING (has_role(auth.uid(), 'merchant') OR has_role(auth.uid(), 'admin'));

-- System can insert email sends
CREATE POLICY "System can insert email sends"
  ON public.email_sends
  FOR INSERT
  WITH CHECK (true);

-- Merchants can manage automation sequences
CREATE POLICY "Merchants can manage automations"
  ON public.automation_sequences
  FOR ALL
  USING (has_role(auth.uid(), 'merchant') OR has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_email_sends_campaign_id ON public.email_sends(campaign_id);
CREATE INDEX idx_email_sends_user_id ON public.email_sends(user_id);
CREATE INDEX idx_email_sends_opened_at ON public.email_sends(opened_at);
CREATE INDEX idx_email_sends_clicked_at ON public.email_sends(clicked_at);
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_automation_sequences_active ON public.automation_sequences(is_active);