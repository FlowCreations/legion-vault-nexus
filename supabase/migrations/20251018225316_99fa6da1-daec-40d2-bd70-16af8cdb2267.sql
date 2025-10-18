-- Grant merchant role to authenticated users who access the merchant dashboard
-- This allows them to use AI features for campaign and funnel generation

-- First, let's insert merchant role for the current authenticated user
-- Note: This is a one-time setup. In production, you'd have a proper role assignment flow
INSERT INTO user_roles (user_id, role)
SELECT auth.uid(), 'merchant'::app_role
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role = 'merchant'::app_role
);