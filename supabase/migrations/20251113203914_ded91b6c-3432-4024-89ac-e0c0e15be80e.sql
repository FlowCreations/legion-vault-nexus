-- Add phone number and SMS opt-in fields to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS sms_opt_in boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_opted_out_at timestamptz;

-- Create SMS sends table (mirrors email_sends structure)
CREATE TABLE IF NOT EXISTS sms_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES email_campaigns(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  message_body text NOT NULL,
  delivered_at timestamptz,
  clicked_at timestamptz,
  purchased_at timestamptz,
  send_sequence_number integer DEFAULT 1,
  status text DEFAULT 'pending',
  twilio_message_sid text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on sms_sends
ALTER TABLE sms_sends ENABLE ROW LEVEL SECURITY;

-- Merchants can view SMS sends
CREATE POLICY "Merchants can view SMS sends"
ON sms_sends FOR SELECT
USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage SMS sends
CREATE POLICY "Service role can manage SMS sends"
ON sms_sends FOR ALL
USING (true);

-- Add SMS fields to email_campaigns table
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS channel_type text DEFAULT 'email' CHECK (channel_type IN ('email', 'sms', 'both')),
ADD COLUMN IF NOT EXISTS sms_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_body text;

-- Extend automation_sequences steps to support SMS
-- The steps column is jsonb, so we just need to document the new step type
COMMENT ON COLUMN automation_sequences.steps IS 'Array of step objects. Each step can have type: email, sms, wait, condition, channel_decision. SMS steps should include: { type: "sms", body: "message text", delay_hours: number }';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_sends_campaign_id ON sms_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_sends_user_id ON sms_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_sends_created_at ON sms_sends(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone_number ON user_profiles(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_sms_opt_in ON user_profiles(sms_opt_in) WHERE sms_opt_in = true;

-- Extend email_campaign_engagement_tracking for SMS
ALTER TABLE email_campaign_engagement_tracking
ADD COLUMN IF NOT EXISTS channel text DEFAULT 'email' CHECK (channel IN ('email', 'sms'));

COMMENT ON COLUMN email_campaign_engagement_tracking.action_type IS 'Action types: email_click, email_download, email_purchase, email_subscribe, sms_click, sms_download, sms_purchase, sms_subscribe';