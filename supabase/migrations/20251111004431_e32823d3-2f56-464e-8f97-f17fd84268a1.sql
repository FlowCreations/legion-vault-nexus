-- Create trial email logs table to track sent emails and prevent duplicates
CREATE TABLE public.trial_email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('3_days', '1_day', 'expired')),
  plan_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_trial_email_per_subscription UNIQUE (tenant_id, email_type, subscription_id)
);

-- Enable RLS
ALTER TABLE public.trial_email_logs ENABLE ROW LEVEL SECURITY;

-- Merchants and admins can view all trial email logs
CREATE POLICY "Merchants can view trial email logs"
ON public.trial_email_logs
FOR SELECT
USING (
  has_role(auth.uid(), 'merchant'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Service role can manage trial email logs
CREATE POLICY "Service role can manage trial email logs"
ON public.trial_email_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_trial_email_logs_tenant_id ON public.trial_email_logs(tenant_id);
CREATE INDEX idx_trial_email_logs_subscription_id ON public.trial_email_logs(subscription_id);
CREATE INDEX idx_trial_email_logs_email_type ON public.trial_email_logs(email_type);