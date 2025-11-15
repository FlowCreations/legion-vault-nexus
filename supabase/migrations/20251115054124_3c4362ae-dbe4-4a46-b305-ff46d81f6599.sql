-- JRNY Hybrid Funnel System - Complete Database Schema

-- 1. Marketing Interactions - Master tracking table for all touchpoints
CREATE TABLE IF NOT EXISTS public.marketing_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'sms', 'inbox', 'popup')),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('sent', 'delivered', 'opened', 'clicked', 'converted', 'closed', 'ignored')),
  campaign_id UUID,
  goal_id UUID,
  sequence_id UUID,
  interaction_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_marketing_interactions_user_id ON public.marketing_interactions(user_id);
CREATE INDEX idx_marketing_interactions_channel ON public.marketing_interactions(channel_type);
CREATE INDEX idx_marketing_interactions_timestamp ON public.marketing_interactions(interaction_timestamp);
CREATE INDEX idx_marketing_interactions_goal ON public.marketing_interactions(goal_id);

-- 2. Marketing Goals - Campaign goals with target outcomes
CREATE TABLE IF NOT EXISTS public.marketing_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  goal_name TEXT NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('product_sale', 'event_ticket', 'engagement', 'retention', 'custom')),
  target_audience_filter JSONB DEFAULT '{}',
  desired_conversion TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  total_enrolled INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_marketing_goals_merchant ON public.marketing_goals(merchant_id);
CREATE INDEX idx_marketing_goals_status ON public.marketing_goals(status);

-- 3. User Engagement State - Tracks user's current engagement profile
CREATE TABLE IF NOT EXISTS public.user_engagement_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_engagement_level TEXT DEFAULT 'warm' CHECK (email_engagement_level IN ('hot', 'warm', 'cold', 'dead')),
  sms_engagement_level TEXT DEFAULT 'warm' CHECK (sms_engagement_level IN ('hot', 'warm', 'cold', 'opted_out')),
  inbox_engagement_level TEXT DEFAULT 'active' CHECK (inbox_engagement_level IN ('active', 'inactive')),
  popup_engagement_level TEXT DEFAULT 'responsive' CHECK (popup_engagement_level IN ('responsive', 'dismissive', 'blocked')),
  last_email_sent TIMESTAMP WITH TIME ZONE,
  last_sms_sent TIMESTAMP WITH TIME ZONE,
  last_inbox_sent TIMESTAMP WITH TIME ZONE,
  last_popup_shown TIMESTAMP WITH TIME ZONE,
  last_conversion TIMESTAMP WITH TIME ZONE,
  consecutive_no_opens INTEGER DEFAULT 0,
  consecutive_sms_interactions INTEGER DEFAULT 0,
  consecutive_popup_dismissals INTEGER DEFAULT 0,
  popup_cooldown_until TIMESTAMP WITH TIME ZONE,
  global_cooldown_until TIMESTAMP WITH TIME ZONE,
  channel_preference TEXT DEFAULT 'email' CHECK (channel_preference IN ('email', 'sms', 'inbox', 'popup')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_engagement_email_level ON public.user_engagement_state(email_engagement_level);
CREATE INDEX idx_user_engagement_cooldown ON public.user_engagement_state(global_cooldown_until);

-- 4. Adaptive Sequences - The IF/THEN decision trees
CREATE TABLE IF NOT EXISTS public.adaptive_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.marketing_goals(id) ON DELETE CASCADE,
  sequence_name TEXT NOT NULL,
  decision_tree JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  fatigue_rules JSONB DEFAULT '{"max_email_24h": 1, "max_sms_72h": 1, "max_inbox_48h": 1, "max_popup_72h": 1}',
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_adaptive_sequences_goal ON public.adaptive_sequences(goal_id);
CREATE INDEX idx_adaptive_sequences_active ON public.adaptive_sequences(is_active);

-- 5. Sequence Executions - Track where each user is in their adaptive journey
CREATE TABLE IF NOT EXISTS public.sequence_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES public.adaptive_sequences(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.marketing_goals(id) ON DELETE CASCADE,
  current_decision_node TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'goal_achieved', 'fatigued_out', 'opted_out', 'expired')),
  metadata JSONB DEFAULT '{}',
  decision_history JSONB DEFAULT '[]',
  next_action_scheduled_for TIMESTAMP WITH TIME ZONE,
  next_action_type TEXT,
  next_action_config JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sequence_executions_user ON public.sequence_executions(user_id);
CREATE INDEX idx_sequence_executions_sequence ON public.sequence_executions(sequence_id);
CREATE INDEX idx_sequence_executions_status ON public.sequence_executions(status);
CREATE INDEX idx_sequence_executions_scheduled ON public.sequence_executions(next_action_scheduled_for);

-- 6. Inbox Messages - New channel for personal messages
CREATE TABLE IF NOT EXISTS public.inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_execution_id UUID REFERENCES public.sequence_executions(id) ON DELETE SET NULL,
  from_name TEXT DEFAULT 'JRNY Team',
  subject TEXT,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'marketing' CHECK (message_type IN ('marketing', 'transactional', 'support')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  replied BOOLEAN DEFAULT false,
  replied_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inbox_messages_user ON public.inbox_messages(user_id);
CREATE INDEX idx_inbox_messages_read ON public.inbox_messages(is_read);
CREATE INDEX idx_inbox_messages_created ON public.inbox_messages(created_at);

-- 7. Popup Displays - Track popup shows for fatigue prevention
CREATE TABLE IF NOT EXISTS public.popup_displays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_execution_id UUID REFERENCES public.sequence_executions(id) ON DELETE SET NULL,
  popup_type TEXT NOT NULL,
  content JSONB NOT NULL,
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action_taken TEXT CHECK (action_taken IN ('clicked', 'closed', 'converted', null)),
  action_timestamp TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_popup_displays_user ON public.popup_displays(user_id);
CREATE INDEX idx_popup_displays_shown ON public.popup_displays(shown_at);

-- Enable RLS on all tables
ALTER TABLE public.marketing_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_engagement_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adaptive_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_displays ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_interactions
CREATE POLICY "Merchants can view all interactions"
  ON public.marketing_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('merchant', 'admin')
    )
  );

CREATE POLICY "System can insert interactions"
  ON public.marketing_interactions FOR INSERT
  WITH CHECK (true);

-- RLS Policies for marketing_goals
CREATE POLICY "Merchants can manage goals"
  ON public.marketing_goals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('merchant', 'admin')
    )
  );

-- RLS Policies for user_engagement_state
CREATE POLICY "Merchants can view engagement states"
  ON public.user_engagement_state FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('merchant', 'admin')
    )
  );

CREATE POLICY "System can manage engagement states"
  ON public.user_engagement_state FOR ALL
  USING (true);

-- RLS Policies for adaptive_sequences
CREATE POLICY "Merchants can manage sequences"
  ON public.adaptive_sequences FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('merchant', 'admin')
    )
  );

-- RLS Policies for sequence_executions
CREATE POLICY "Merchants can view executions"
  ON public.sequence_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('merchant', 'admin')
    )
  );

CREATE POLICY "System can manage executions"
  ON public.sequence_executions FOR ALL
  USING (true);

-- RLS Policies for inbox_messages
CREATE POLICY "Users can view their own messages"
  ON public.inbox_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON public.inbox_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Merchants can view all messages"
  ON public.inbox_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('merchant', 'admin')
    )
  );

CREATE POLICY "System can insert messages"
  ON public.inbox_messages FOR INSERT
  WITH CHECK (true);

-- RLS Policies for popup_displays
CREATE POLICY "Users can view their own popups"
  ON public.popup_displays FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage popups"
  ON public.popup_displays FOR ALL
  USING (true);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_marketing_goals_updated_at
  BEFORE UPDATE ON public.marketing_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_engagement_state_updated_at
  BEFORE UPDATE ON public.user_engagement_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adaptive_sequences_updated_at
  BEFORE UPDATE ON public.adaptive_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequence_executions_updated_at
  BEFORE UPDATE ON public.sequence_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();