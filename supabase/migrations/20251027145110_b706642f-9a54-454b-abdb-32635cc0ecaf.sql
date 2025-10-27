-- Stage 4A: Automation Sequences Core Tables

-- Track individual automation enrollments
CREATE TABLE automation_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES automation_sequences(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(user_id),
  status TEXT DEFAULT 'active',
  current_step_index INT DEFAULT 0,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  exit_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(automation_id, user_id)
);

-- Track execution of individual automation steps
CREATE TABLE automation_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES automation_enrollments(id) ON DELETE CASCADE,
  step_index INT NOT NULL,
  step_type TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B test variants
CREATE TABLE ab_test_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  subject_line TEXT,
  email_body TEXT,
  traffic_percentage INT DEFAULT 50,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track which variant each user received
CREATE TABLE ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES ab_test_variants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(user_id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

-- Store optimal send times per user
CREATE TABLE user_send_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(user_id) UNIQUE,
  optimal_send_hour INT,
  optimal_send_day TEXT,
  timezone TEXT,
  confidence_score DECIMAL(3,2),
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  open_pattern JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_automation_enrollments_user ON automation_enrollments(user_id);
CREATE INDEX idx_automation_enrollments_automation ON automation_enrollments(automation_id);
CREATE INDEX idx_automation_enrollments_status ON automation_enrollments(status);
CREATE INDEX idx_step_executions_enrollment ON automation_step_executions(enrollment_id);
CREATE INDEX idx_step_executions_scheduled ON automation_step_executions(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_ab_assignments_campaign_user ON ab_test_assignments(campaign_id, user_id);

-- Add campaign_type column to email_campaigns
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS campaign_type TEXT DEFAULT 'standard';
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS test_duration INT;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS winner_criteria TEXT;

-- Enable RLS
ALTER TABLE automation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_send_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own enrollments"
  ON automation_enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage enrollments"
  ON automation_enrollments FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view their own step executions"
  ON automation_step_executions FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM automation_enrollments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage step executions"
  ON automation_step_executions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view their AB test assignments"
  ON ab_test_assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage AB test assignments"
  ON ab_test_assignments FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Anyone can view AB test variants"
  ON ab_test_variants FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage AB test variants"
  ON ab_test_variants FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view their own send preferences"
  ON user_send_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage send preferences"
  ON user_send_preferences FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');