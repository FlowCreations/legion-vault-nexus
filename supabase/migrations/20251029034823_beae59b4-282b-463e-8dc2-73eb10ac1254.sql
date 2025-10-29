-- Update feature flag name from flow_leader_active to agent_active
UPDATE public.feature_flags
SET flag_name = 'agent_active'
WHERE flag_name = 'flow_leader_active';