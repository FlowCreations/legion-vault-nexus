-- Stage 3 Email Intelligence Enhancements

-- Add fields to email_templates
ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';

-- Add fields to email_campaigns
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS ai_generated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS analytics jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS campaign_goal text,
ADD COLUMN IF NOT EXISTS tone text DEFAULT 'casual';

-- Create indexes for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign_opened ON email_sends(campaign_id) WHERE opened_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign_clicked ON email_sends(campaign_id) WHERE clicked_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign_sent ON email_sends(campaign_id, sent_at);