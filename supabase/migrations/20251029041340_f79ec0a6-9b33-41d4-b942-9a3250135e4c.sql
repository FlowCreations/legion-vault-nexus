-- Phase 1: Create tables for Human-Latency Autoresponder System

-- 1. Artist Personality Table
CREATE TABLE IF NOT EXISTS public.artist_personality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL,
  tone_style TEXT DEFAULT 'warm', -- warm/casual/deep/funny/poetic
  greeting_style TEXT DEFAULT 'Hey!',
  emoji_patterns JSONB DEFAULT '["🎵", "❤️", "🔥"]'::jsonb,
  signoff_style TEXT DEFAULT 'Much love',
  avoid_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  emotional_triggers JSONB DEFAULT '{}'::jsonb,
  sentence_style TEXT DEFAULT 'full', -- full/short
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Response Queue Table (for delayed human-latency responses)
CREATE TABLE IF NOT EXISTS public.response_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  trigger_event_id UUID,
  message_content TEXT NOT NULL,
  scheduled_send_time TIMESTAMPTZ NOT NULL,
  actual_send_time TIMESTAMPTZ,
  status TEXT DEFAULT 'queued', -- queued/sent/cancelled
  priority TEXT DEFAULT 'medium', -- urgent/high/medium/low
  response_category TEXT DEFAULT 'general', -- gratitude/question/emotional/technical/engagement/general
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Response Templates Table
CREATE TABLE IF NOT EXISTS public.response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL,
  category TEXT NOT NULL, -- gratitude/question/emotional/technical/engagement
  template_text TEXT NOT NULL,
  min_delay_minutes INTEGER DEFAULT 60,
  max_delay_minutes INTEGER DEFAULT 180,
  is_approved BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Agent Interactions Table (dedicated tracking)
CREATE TABLE IF NOT EXISTS public.agent_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  trigger_type TEXT NOT NULL,
  user_message TEXT,
  agent_response TEXT NOT NULL,
  emotional_state TEXT,
  engagement_level TEXT,
  response_delay_minutes INTEGER,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artist_personality ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artist_personality
CREATE POLICY "Merchants and admins can manage artist personality"
  ON public.artist_personality
  FOR ALL
  USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for response_queue
CREATE POLICY "Service role can manage response queue"
  ON public.response_queue
  FOR ALL
  USING (true);

CREATE POLICY "Merchants can view response queue"
  ON public.response_queue
  FOR SELECT
  USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for response_templates
CREATE POLICY "Merchants and admins can manage templates"
  ON public.response_templates
  FOR ALL
  USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for agent_interactions
CREATE POLICY "Merchants can view agent interactions"
  ON public.agent_interactions
  FOR SELECT
  USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage agent interactions"
  ON public.agent_interactions
  FOR ALL
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_response_queue_scheduled ON public.response_queue(scheduled_send_time, status);
CREATE INDEX IF NOT EXISTS idx_response_queue_user ON public.response_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_user ON public.agent_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_response_templates_category ON public.response_templates(category);