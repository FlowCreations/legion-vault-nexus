-- Phase 2 & 3: Add new fields to existing tables and create new tables for auto-retargeting

-- Add new fields to email_sends table
ALTER TABLE email_sends 
ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS spam_reported_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS send_sequence_number INTEGER DEFAULT 1;

-- Add new fields to email_campaigns table
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS campaign_duration_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS max_sends_per_user INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS conversion_tracked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS conversion_goal_type TEXT;

-- Create campaign sequences table
CREATE TABLE IF NOT EXISTS email_campaign_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  subject_line TEXT NOT NULL,
  email_body TEXT NOT NULL,
  target_segment TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppressions table
CREATE TABLE IF NOT EXISTS email_campaign_suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  suppressed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

-- Create engagement tracking table (Phase 6)
CREATE TABLE IF NOT EXISTS email_campaign_engagement_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_metadata JSONB DEFAULT '{}',
  tracked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE email_campaign_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_engagement_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_campaign_sequences
CREATE POLICY "Merchants can view sequences"
  ON email_campaign_sequences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('merchant', 'admin')
    )
  );

CREATE POLICY "Service role can manage sequences"
  ON email_campaign_sequences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for email_campaign_suppressions
CREATE POLICY "Merchants can view suppressions"
  ON email_campaign_suppressions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('merchant', 'admin')
    )
  );

CREATE POLICY "Service role can manage suppressions"
  ON email_campaign_suppressions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for email_campaign_engagement_tracking
CREATE POLICY "Merchants can view engagement tracking"
  ON email_campaign_engagement_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('merchant', 'admin')
    )
  );

CREATE POLICY "Anyone can insert engagement tracking"
  ON email_campaign_engagement_tracking FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can manage engagement tracking"
  ON email_campaign_engagement_tracking FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_sends_purchased_at ON email_sends(purchased_at);
CREATE INDEX IF NOT EXISTS idx_email_sends_sequence_number ON email_sends(send_sequence_number);
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_campaign_id ON email_campaign_sequences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_suppressions_campaign_user ON email_campaign_suppressions(campaign_id, user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_tracking_campaign_user ON email_campaign_engagement_tracking(campaign_id, user_id);