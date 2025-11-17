-- Add payday tracking columns to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS payday_pattern jsonb DEFAULT '{"detected": false}'::jsonb,
ADD COLUMN IF NOT EXISTS likely_payday_dates integer[] DEFAULT ARRAY[]::integer[],
ADD COLUMN IF NOT EXISTS payday_confidence_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_payday_analysis timestamp DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payroll_cycle_type text DEFAULT NULL;

-- Create new PTP behavior weights for payday patterns
INSERT INTO ptp_behavior_weights (behavior_key, behavior_name, weight, zone, tier, description) VALUES
  ('near_payday', 'Near Payday Window', 15, 'green', 'transactional', 'User contacted within 3 days after likely payday'),
  ('payday_detected', 'Payday Pattern Identified', 8, 'yellow', 'exploratory', 'User shows consistent monthly purchase pattern'),
  ('post_payday_purchaser', 'Post-Payday Buyer', 12, 'green', 'transactional', 'Historical pattern of purchasing after payday'),
  ('pre_payday_contacted', 'Pre-Payday Contact', -5, 'red', 'passive', 'Contacted before payday when funds likely low'),
  ('biweekly_payday', 'Biweekly Payroll Cycle', 10, 'green', 'exploratory', 'User on biweekly pay schedule (2 paydays/month)')
ON CONFLICT (behavior_key) DO NOTHING;