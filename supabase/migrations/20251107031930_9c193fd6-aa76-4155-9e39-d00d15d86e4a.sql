-- Add feature flag for heartbeat integration
INSERT INTO feature_flags (flag_name, enabled)
VALUES (
  'enable_heartbeat_integration',
  true
)
ON CONFLICT (flag_name) DO NOTHING;