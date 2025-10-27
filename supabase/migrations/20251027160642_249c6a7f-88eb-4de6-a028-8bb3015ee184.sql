-- Phase 1: Database Schema Extension for Multi-API Email Analytics

-- Create api_sync_logs table to track all API sync operations
CREATE TABLE IF NOT EXISTS public.api_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.api_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants and admins can view API sync logs"
  ON public.api_sync_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'merchant'::app_role));

CREATE POLICY "Service role can manage API sync logs"
  ON public.api_sync_logs
  FOR ALL
  USING (true);

-- Create social_engagement_data table for Meta Graph API data
CREATE TABLE IF NOT EXISTS public.social_engagement_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  post_id TEXT,
  engagement_type TEXT,
  engagement_value JSONB,
  occurred_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.social_engagement_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants and admins can view social engagement data"
  ON public.social_engagement_data
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'merchant'::app_role));

CREATE POLICY "Service role can manage social engagement data"
  ON public.social_engagement_data
  FOR ALL
  USING (true);

-- Create messenger_interactions table for Meta Messenger API data
CREATE TABLE IF NOT EXISTS public.messenger_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id TEXT,
  message_type TEXT,
  link_url TEXT,
  occurred_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.messenger_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants and admins can view messenger interactions"
  ON public.messenger_interactions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'merchant'::app_role));

CREATE POLICY "Service role can manage messenger interactions"
  ON public.messenger_interactions
  FOR ALL
  USING (true);

-- Create session_analytics table for GA4/Mixpanel data
CREATE TABLE IF NOT EXISTS public.session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  page_views INTEGER,
  bounce_rate DECIMAL,
  time_on_site INTEGER,
  abandoned_cart BOOLEAN DEFAULT false,
  conversion_funnel_stage TEXT,
  occurred_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants and admins can view session analytics"
  ON public.session_analytics
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'merchant'::app_role));

CREATE POLICY "Service role can manage session analytics"
  ON public.session_analytics
  FOR ALL
  USING (true);

-- Create music_streaming_data table for Spotify/SoundCloud data
CREATE TABLE IF NOT EXISTS public.music_streaming_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  track_id TEXT,
  track_name TEXT,
  artist_name TEXT,
  play_count INTEGER DEFAULT 0,
  skip_count INTEGER DEFAULT 0,
  repeat_count INTEGER DEFAULT 0,
  total_play_time_seconds INTEGER,
  last_played_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.music_streaming_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants and admins can view music streaming data"
  ON public.music_streaming_data
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'merchant'::app_role));

CREATE POLICY "Service role can manage music streaming data"
  ON public.music_streaming_data
  FOR ALL
  USING (true);

-- Create ai_email_insights table for AI-generated recommendations
CREATE TABLE IF NOT EXISTS public.ai_email_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL,
  insight_title TEXT NOT NULL,
  insight_description TEXT NOT NULL,
  insight_data JSONB,
  confidence_score DECIMAL,
  actionable_steps JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  applied_at TIMESTAMPTZ,
  result_metrics JSONB
);

ALTER TABLE public.ai_email_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants and admins can view AI insights"
  ON public.ai_email_insights
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'merchant'::app_role));

CREATE POLICY "Service role can manage AI insights"
  ON public.ai_email_insights
  FOR ALL
  USING (true);

-- Extend user_profiles table with external platform fields
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS jrny_member_id TEXT,
  ADD COLUMN IF NOT EXISTS purchase_history JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS membership_tier TEXT,
  ADD COLUMN IF NOT EXISTS community_engagement_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tunepipe_subscriber_id TEXT,
  ADD COLUMN IF NOT EXISTS external_ids JSONB DEFAULT '{}'::jsonb;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_api_sync_logs_api_name ON public.api_sync_logs(api_name);
CREATE INDEX IF NOT EXISTS idx_api_sync_logs_status ON public.api_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_social_engagement_user_id ON public.social_engagement_data(user_id);
CREATE INDEX IF NOT EXISTS idx_messenger_interactions_user_id ON public.messenger_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_session_analytics_user_id ON public.session_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_music_streaming_user_id ON public.music_streaming_data(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON public.ai_email_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tunepipe_id ON public.user_profiles(tunepipe_subscriber_id);