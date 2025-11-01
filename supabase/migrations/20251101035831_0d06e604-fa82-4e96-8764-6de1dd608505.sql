-- Add Christ-conscious tracking fields to email_campaigns
ALTER TABLE email_campaigns 
ADD COLUMN IF NOT EXISTS ethos_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS love_first_validation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS manipulation_flags INTEGER DEFAULT 0;

-- Track campaign performance by ethos
CREATE TABLE IF NOT EXISTS ethos_performance_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  ethos_score NUMERIC NOT NULL,
  open_rate NUMERIC,
  click_rate NUMERIC,
  conversion_rate NUMERIC,
  love_first BOOLEAN DEFAULT FALSE,
  empowerment_language BOOLEAN DEFAULT FALSE,
  truth_based BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on ethos_performance_tracking
ALTER TABLE ethos_performance_tracking ENABLE ROW LEVEL SECURITY;

-- Merchants can view their ethos performance
CREATE POLICY "Merchants can view ethos performance"
  ON ethos_performance_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('merchant', 'admin')
    )
  );

-- Service role can manage all
CREATE POLICY "Service role can manage ethos performance"
  ON ethos_performance_tracking FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ethos_performance_campaign_id ON ethos_performance_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ethos_performance_score ON ethos_performance_tracking(ethos_score DESC);