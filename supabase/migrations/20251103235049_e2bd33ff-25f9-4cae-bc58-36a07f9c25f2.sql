-- Create next_best_actions table for NBA queue
CREATE TABLE IF NOT EXISTS public.next_best_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  offer_id TEXT,
  message_recipe JSONB NOT NULL DEFAULT '{}'::jsonb,
  predicted_conversion_rate NUMERIC,
  personality_match JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.next_best_actions ENABLE ROW LEVEL SECURITY;

-- Merchants can view all NBAs
CREATE POLICY "Merchants can view next best actions"
  ON public.next_best_actions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('merchant', 'admin')
    )
  );

-- Service role can manage NBAs
CREATE POLICY "Service role can manage next best actions"
  ON public.next_best_actions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_nba_user_status 
  ON public.next_best_actions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_nba_scheduled 
  ON public.next_best_actions(scheduled_for) 
  WHERE status = 'pending';