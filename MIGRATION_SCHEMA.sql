-- =====================================================
-- SONS OF LEGION - COMPLETE DATABASE SCHEMA MIGRATION
-- Target: Supabase Pro (ojphjfrswqubslbvfhiw)
-- =====================================================

-- Create custom types
CREATE TYPE app_role AS ENUM ('admin', 'merchant', 'user');
CREATE TYPE event_type AS ENUM (
  'video_watch', 'music_listen', 'product_view', 'purchase',
  'cart_add', 'cart_abandon', 'email_open', 'email_click',
  'livestream_join', 'livestream_reaction', 'comment', 'share'
);

-- =====================================================
-- CORE USER TABLES
-- =====================================================

-- User Profiles (Primary user data table)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  real_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  birthdate DATE,
  gender TEXT,
  location TEXT,
  country TEXT,
  region TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  membership_tier TEXT DEFAULT 'free',
  tier TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  subscription_period_end TIMESTAMPTZ,
  watch_time INTEGER DEFAULT 0,
  listen_time INTEGER DEFAULT 0,
  total_purchases NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  lifetime_value NUMERIC DEFAULT 0,
  last_login TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  livestream_reaction_count INTEGER DEFAULT 0,
  livestream_hearts_sent INTEGER DEFAULT 0,
  livestream_claps_sent INTEGER DEFAULT 0,
  livestream_engagement_score NUMERIC DEFAULT 0,
  last_livestream_reaction TIMESTAMPTZ,
  is_super_fan BOOLEAN DEFAULT false,
  heartbeat_member_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Milestone Progress
CREATE TABLE IF NOT EXISTS public.milestone_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_minutes INTEGER DEFAULT 0,
  current_badge TEXT,
  next_milestone_minutes INTEGER,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- User Milestones
CREATE TABLE IF NOT EXISTS public.user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  total_minutes_at_achievement INTEGER NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reward_claimed BOOLEAN DEFAULT false,
  reward_claimed_at TIMESTAMPTZ,
  shipping_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, milestone_type)
);

-- Personality Profiles (MBTI + traits)
CREATE TABLE IF NOT EXISTS public.personality_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  mbti_type TEXT,
  p_e NUMERIC DEFAULT 0.5 CHECK (p_e BETWEEN 0 AND 1),
  p_i NUMERIC DEFAULT 0.5 CHECK (p_i BETWEEN 0 AND 1),
  p_s NUMERIC DEFAULT 0.5 CHECK (p_s BETWEEN 0 AND 1),
  p_n NUMERIC DEFAULT 0.5 CHECK (p_n BETWEEN 0 AND 1),
  p_t NUMERIC DEFAULT 0.5 CHECK (p_t BETWEEN 0 AND 1),
  p_f NUMERIC DEFAULT 0.5 CHECK (p_f BETWEEN 0 AND 1),
  p_j NUMERIC DEFAULT 0.5 CHECK (p_j BETWEEN 0 AND 1),
  p_p NUMERIC DEFAULT 0.5 CHECK (p_p BETWEEN 0 AND 1),
  assertiveness NUMERIC DEFAULT 0.5,
  confidence_score NUMERIC DEFAULT 0.5,
  survey_responses JSONB DEFAULT '{}',
  feature_vector JSONB,
  last_computed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Behavior Profiles
CREATE TABLE IF NOT EXISTS public.user_behavior_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_visits INTEGER DEFAULT 0,
  total_session_time_seconds INTEGER DEFAULT 0,
  favorite_content_types JSONB DEFAULT '{}',
  favorite_tracks TEXT[],
  favorite_products TEXT[],
  engagement_score NUMERIC DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  purchase_history_summary JSONB DEFAULT '{}',
  music_taste_profile JSONB DEFAULT '{}',
  visit_frequency TEXT,
  behavioral_segments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INTELLIGENCE & SCORING TABLES
-- =====================================================

-- ERA/PTP Scores Daily
CREATE TABLE IF NOT EXISTS public.era_ptp_scores_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  era INTEGER,
  ptp INTEGER,
  era_components JSONB,
  ptp_components JSONB,
  flags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, date)
);

-- Match Matrix Scores
CREATE TABLE IF NOT EXISTS public.match_matrix_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  recency_score INTEGER DEFAULT 0,
  frequency_score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  affinity_score INTEGER DEFAULT 0,
  total_match_score INTEGER DEFAULT 0,
  segment TEXT,
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Avatar Archetypes (AI-generated personas)
CREATE TABLE IF NOT EXISTS public.avatar_archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_name TEXT NOT NULL,
  description TEXT,
  member_count INTEGER DEFAULT 0,
  confidence_score NUMERIC DEFAULT 0,
  core_demographic JSONB DEFAULT '{}',
  psychographic_personality JSONB DEFAULT '{}',
  behavioral_patterns JSONB DEFAULT '{}',
  emotional_energy_profile JSONB DEFAULT '{}',
  cultural_symbolic_affinities JSONB DEFAULT '{}',
  socioeconomic_context JSONB DEFAULT '{}',
  experiential_aspirational JSONB DEFAULT '{}',
  predictive_signals JSONB DEFAULT '{}',
  conversion_predictions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Next Best Actions (AI recommendations)
CREATE TABLE IF NOT EXISTS public.next_best_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  message_recipe JSONB NOT NULL DEFAULT '{}',
  offer_id TEXT,
  predicted_conversion_rate NUMERIC,
  personality_match JSONB DEFAULT '{}',
  ptp_score NUMERIC NOT NULL,
  ptp_status TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- EVENTS & ANALYTICS
-- =====================================================

-- Events (main event tracking)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type event_type NOT NULL,
  content_id TEXT,
  value NUMERIC DEFAULT 0,
  duration_sec INTEGER,
  sentiment NUMERIC,
  click_latency_ms INTEGER,
  meta JSONB,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events Archive (90+ day old events)
CREATE TABLE IF NOT EXISTS public.events_archive (
  id UUID PRIMARY KEY,
  member_id UUID,
  type event_type NOT NULL,
  content_id TEXT,
  value NUMERIC DEFAULT 0,
  duration_sec INTEGER,
  sentiment NUMERIC,
  click_latency_ms INTEGER,
  meta JSONB,
  ts TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Events (specific tracking)
CREATE TABLE IF NOT EXISTS public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Behavioral Data Snapshots (daily aggregates)
CREATE TABLE IF NOT EXISTS public.behavioral_data_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE DEFAULT CURRENT_DATE,
  total_searches INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  cart_additions INTEGER DEFAULT 0,
  cart_abandonments INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  top_search_terms JSONB,
  top_discussed_topics JSONB,
  avg_session_duration_sec NUMERIC,
  avg_content_consumed_minutes NUMERIC,
  discover_count INTEGER DEFAULT 0,
  engage_count INTEGER DEFAULT 0,
  invest_count INTEGER DEFAULT 0,
  loyal_count INTEGER DEFAULT 0,
  high_ptp_count INTEGER DEFAULT 0,
  avg_ptp_score NUMERIC,
  avg_era_score NUMERIC,
  journey_transitions JSONB,
  ptp_calculation_details JSONB,
  era_calculation_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MARKETING & CAMPAIGNS
-- =====================================================

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL,
  target_segment TEXT,
  target_criteria JSONB,
  channel TEXT NOT NULL,
  message_template TEXT,
  offer_details JSONB,
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  performance_metrics JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Targets V2
CREATE TABLE IF NOT EXISTS public.campaign_targets_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ptp_score NUMERIC NOT NULL,
  ptp_status TEXT NOT NULL,
  personalization_data JSONB,
  message_sent_at TIMESTAMPTZ,
  message_opened_at TIMESTAMPTZ,
  message_clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  revenue_generated NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Message Log
CREATE TABLE IF NOT EXISTS public.campaign_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  message_content JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catalyst Campaigns (automated)
CREATE TABLE IF NOT EXISTS public.catalyst_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_type TEXT NOT NULL,
  target_segment TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  message_template TEXT NOT NULL,
  offer_type TEXT,
  offer_value JSONB,
  priority INTEGER,
  max_sends_per_user INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catalyst Executions
CREATE TABLE IF NOT EXISTS public.catalyst_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES catalyst_campaigns(id),
  user_id UUID REFERENCES auth.users(id),
  channel TEXT NOT NULL,
  segment TEXT,
  ptp_score NUMERIC,
  era_score NUMERIC,
  message_sent TEXT,
  metadata JSONB,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  conversion_value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catalyst Performance (daily metrics)
CREATE TABLE IF NOT EXISTS public.catalyst_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES catalyst_campaigns(id),
  date DATE DEFAULT CURRENT_DATE,
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  open_rate NUMERIC,
  click_rate NUMERIC,
  conversion_rate NUMERIC,
  avg_conversion_value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaigns (legacy)
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  email_body TEXT NOT NULL,
  target_segment TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaign Analytics
CREATE TABLE IF NOT EXISTS public.email_campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  sends INTEGER DEFAULT 0,
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  open_rate NUMERIC,
  click_rate NUMERIC,
  conversion_rate NUMERIC,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaign Suppressions (unsubscribes)
CREATE TABLE IF NOT EXISTS public.email_campaign_suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES email_campaigns(id),
  reason TEXT NOT NULL DEFAULT 'conversion',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, campaign_id)
);

-- Email Sends (individual sends)
CREATE TABLE IF NOT EXISTS public.email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ
);

-- Email Logs
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_type)
);

-- =====================================================
-- AUTOMATION
-- =====================================================

-- Automation Sequences
CREATE TABLE IF NOT EXISTS public.automation_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_rules JSONB NOT NULL DEFAULT '{}',
  steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Enrollments
CREATE TABLE IF NOT EXISTS public.automation_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES automation_sequences(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step_index INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  metadata JSONB,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  exit_reason TEXT
);

-- Automation Step Executions
CREATE TABLE IF NOT EXISTS public.automation_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES automation_enrollments(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  step_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Rules (trigger-based)
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER,
  cooldown_hours INTEGER,
  max_sends_per_user INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Rule Executions
CREATE TABLE IF NOT EXISTS public.automation_rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'success',
  metadata JSONB,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  conversion_value NUMERIC
);

-- =====================================================
-- E-COMMERCE
-- =====================================================

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT,
  images TEXT[],
  is_active BOOLEAN DEFAULT true,
  inventory_count INTEGER DEFAULT 0,
  shopify_product_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  sku TEXT,
  inventory_count INTEGER DEFAULT 0,
  options JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  shipping_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  custom_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases (Stripe integration)
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  customer_name TEXT,
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  product_type TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  amount_total NUMERIC NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'completed',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abandoned Carts
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  cart_items JSONB NOT NULL,
  cart_value NUMERIC,
  discount_code TEXT,
  discount_percentage INTEGER DEFAULT 25,
  status TEXT DEFAULT 'pending',
  email_sent_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart Sessions
CREATE TABLE IF NOT EXISTS public.cart_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  cart_items JSONB NOT NULL,
  cart_value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LIVE STREAMING
-- =====================================================

-- Livestream Events
CREATE TABLE IF NOT EXISTS public.livestream_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  livekit_room_name TEXT,
  creator_id UUID REFERENCES auth.users(id),
  thumbnail_url TEXT,
  peak_viewers INTEGER DEFAULT 0,
  total_reactions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Livestream Reactions
CREATE TABLE IF NOT EXISTS public.livestream_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES livestream_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  reaction_type TEXT NOT NULL,
  timestamp_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Livestream Chat Messages
CREATE TABLE IF NOT EXISTS public.livestream_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES livestream_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Livestream Highlights
CREATE TABLE IF NOT EXISTS public.livestream_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES livestream_events(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  start_time_seconds INTEGER NOT NULL,
  end_time_seconds INTEGER NOT NULL,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  video_url TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CONTENT
-- =====================================================

-- Videos
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  view_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  metatags TEXT[] DEFAULT ARRAY[]::TEXT[],
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Music Tracks
CREATE TABLE IF NOT EXISTS public.music_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  duration INTEGER,
  storage_path TEXT NOT NULL,
  cover_art_url TEXT,
  genre TEXT,
  play_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community Posts
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  post_type TEXT,
  category TEXT,
  media_url TEXT,
  link_url TEXT,
  tagged_all BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Comments
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Reactions
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- =====================================================
-- CAMEOS
-- =====================================================

-- Cameos
CREATE TABLE IF NOT EXISTS public.cameos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_user_id UUID REFERENCES auth.users(id),
  recipient_manual_name TEXT,
  message_type TEXT NOT NULL,
  message_text TEXT,
  video_url TEXT,
  video_thumbnail_url TEXT,
  display_duration TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cameo Requests
CREATE TABLE IF NOT EXISTS public.cameo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID REFERENCES auth.users(id),
  requester_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  occasion_type TEXT NOT NULL,
  special_instructions TEXT,
  price_paid NUMERIC NOT NULL DEFAULT 50.00,
  payment_status TEXT DEFAULT 'pending',
  fulfillment_status TEXT DEFAULT 'pending',
  stripe_checkout_session_id TEXT,
  stripe_payment_id TEXT,
  completed_cameo_id UUID REFERENCES cameos(id),
  requested_delivery_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cameo Notifications
CREATE TABLE IF NOT EXISTS public.cameo_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cameo_id UUID REFERENCES cameos(id) ON DELETE CASCADE,
  recipient_user_id UUID REFERENCES auth.users(id),
  notification_type TEXT,
  email_enabled BOOLEAN DEFAULT true,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FUNNEL TRACKING
-- =====================================================

-- Funnel Pages
CREATE TABLE IF NOT EXISTS public.funnel_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number INTEGER NOT NULL,
  variant_name TEXT NOT NULL,
  page_title TEXT NOT NULL,
  page_content JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(step_number, variant_name)
);

-- Funnel Sessions
CREATE TABLE IF NOT EXISTS public.funnel_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  entry_step INTEGER DEFAULT 1,
  current_step INTEGER DEFAULT 1,
  variant_assignments JSONB DEFAULT '{}',
  completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  conversion_step INTEGER,
  total_revenue NUMERIC DEFAULT 0,
  meta JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ
);

-- Funnel Conversions
CREATE TABLE IF NOT EXISTS public.funnel_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  converted_at_step INTEGER NOT NULL,
  revenue NUMERIC NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AB Test Results
CREATE TABLE IF NOT EXISTS public.ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number INTEGER NOT NULL,
  variant_name TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate NUMERIC,
  total_revenue NUMERIC DEFAULT 0,
  avg_order_value NUMERIC,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(step_number, variant_name)
);

-- =====================================================
-- COMMUNITY ANALYTICS
-- =====================================================

-- Community Analytics
CREATE TABLE IF NOT EXISTS public.community_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_members INTEGER NOT NULL DEFAULT 0,
  active_members_7d INTEGER NOT NULL DEFAULT 0,
  active_members_30d INTEGER NOT NULL DEFAULT 0,
  new_members_today INTEGER NOT NULL DEFAULT 0,
  tier_free INTEGER NOT NULL DEFAULT 0,
  tier_rebel INTEGER NOT NULL DEFAULT 0,
  tier_outlaw INTEGER NOT NULL DEFAULT 0,
  tier_legionnaire INTEGER NOT NULL DEFAULT 0,
  total_mrr NUMERIC NOT NULL DEFAULT 0,
  avg_ltv NUMERIC NOT NULL DEFAULT 0,
  top_country TEXT,
  top_region TEXT,
  countries_count INTEGER NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- AFFILIATES
-- =====================================================

-- Affiliates
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  ethos TEXT,
  non_negotiables TEXT[],
  social_links JSONB,
  analytics JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Affiliate Content
CREATE TABLE IF NOT EXISTS public.affiliate_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT,
  content_url TEXT,
  thumbnail_url TEXT,
  spotify_track_id TEXT,
  spotify_artist_id TEXT,
  spotify_album_id TEXT,
  artist_name TEXT,
  album_name TEXT,
  duration_ms INTEGER,
  release_date DATE,
  click_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Affiliate Content Clicks
CREATE TABLE IF NOT EXISTS public.affiliate_content_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES affiliate_content(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MULTI-TENANCY
-- =====================================================

-- Platform Admins
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  custom_domain TEXT UNIQUE,
  tagline TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  hero_video_url TEXT,
  about_text TEXT,
  primary_color TEXT DEFAULT '#f7c946',
  secondary_color TEXT DEFAULT '#1a1a1a',
  accent_color TEXT DEFAULT '#8B5CF6',
  social_links JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  plan_tier TEXT DEFAULT 'starter',
  stripe_account_id TEXT,
  shopify_store_domain TEXT,
  shopify_storefront_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Admins
CREATE TABLE IF NOT EXISTS public.tenant_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin',
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Tenant Subscriptions
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  features_enabled JSONB DEFAULT '{}',
  usage_limits JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADDITIONAL TABLES
-- =====================================================

-- Scheduled Emails
CREATE TABLE IF NOT EXISTS public.scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  email_data JSONB NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Verifications
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Popup Displays
CREATE TABLE IF NOT EXISTS public.popup_displays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  sequence_execution_id UUID,
  popup_type TEXT NOT NULL,
  content JSONB NOT NULL,
  action_taken TEXT,
  action_timestamp TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  shown_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Interactions
CREATE TABLE IF NOT EXISTS public.agent_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  trigger_type TEXT NOT NULL,
  agent_response TEXT NOT NULL,
  user_message TEXT,
  emotional_state TEXT,
  engagement_level TEXT,
  behavior_context JSONB,
  response_delay_minutes INTEGER,
  sent_at TIMESTAMPTZ,
  user_clicked_cta BOOLEAN,
  user_dismissed BOOLEAN,
  interaction_outcome TEXT,
  conversion_resulted BOOLEAN,
  conversion_value NUMERIC,
  conversion_event_id UUID REFERENCES events(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Email Insights
CREATE TABLE IF NOT EXISTS public.ai_email_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL,
  insight_title TEXT NOT NULL,
  insight_description TEXT NOT NULL,
  insight_data JSONB,
  confidence_score NUMERIC,
  actionable_steps JSONB,
  applied_at TIMESTAMPTZ,
  result_metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ethos Performance Tracking
CREATE TABLE IF NOT EXISTS public.ethos_performance_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id),
  ethos_score NUMERIC NOT NULL,
  love_first BOOLEAN DEFAULT false,
  empowerment_language BOOLEAN DEFAULT false,
  truth_based BOOLEAN DEFAULT false,
  open_rate NUMERIC,
  click_rate NUMERIC,
  conversion_rate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Send Preferences
CREATE TABLE IF NOT EXISTS public.user_send_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id),
  optimal_send_day TEXT,
  optimal_send_hour INTEGER,
  timezone TEXT,
  confidence_score NUMERIC,
  open_pattern JSONB DEFAULT '{}',
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohorts
CREATE TABLE IF NOT EXISTS public.cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  definition JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohort Members
CREATE TABLE IF NOT EXISTS public.cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_id, member_id)
);

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Calculate distance in miles
CREATE OR REPLACE FUNCTION calculate_distance_miles(
  lat1 NUMERIC, lon1 NUMERIC, lat2 NUMERIC, lon2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  R NUMERIC := 3959;
  dLat NUMERIC;
  dLon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Tenant context functions
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.tenant_id', true)::UUID,
    (current_setting('request.jwt.claims', true)::JSONB->>'tenant_id')::UUID
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION set_tenant_context(_tenant_id UUID) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.tenant_id', _tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is tenant admin
CREATE OR REPLACE FUNCTION is_tenant_admin(_user_id UUID, _tenant_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_admins 
    WHERE user_id = _user_id AND tenant_id = _tenant_id AND accepted_at IS NOT NULL
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin(_user_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_admins WHERE user_id = _user_id
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Check if user has role
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- Update coordinates
CREATE OR REPLACE FUNCTION update_user_coordinates(
  p_user_id UUID, p_latitude NUMERIC, p_longitude NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET latitude = p_latitude, longitude = p_longitude, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Increment watch/listen time
CREATE OR REPLACE FUNCTION increment_watch_time(p_user_id UUID, p_duration INTEGER) RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET watch_time = COALESCE(watch_time, 0) + p_duration, last_login = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION increment_listen_time(p_user_id UUID, p_duration INTEGER) RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET listen_time = COALESCE(listen_time, 0) + p_duration, last_login = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Track affiliate clicks
CREATE OR REPLACE FUNCTION track_affiliate_content_click(
  p_content_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO affiliate_content_clicks (content_id, user_id, session_id, referrer, user_agent)
  VALUES (p_content_id, p_user_id, p_session_id, p_referrer, p_user_agent);
  
  UPDATE affiliate_content 
  SET click_count = COALESCE(click_count, 0) + 1, last_clicked_at = NOW()
  WHERE id = p_content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Archive old events (90+ days)
CREATE OR REPLACE FUNCTION archive_old_events() RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  WITH moved_events AS (
    INSERT INTO events_archive (
      id, member_id, type, content_id, value, duration_sec, 
      sentiment, click_latency_ms, meta, ts, created_at
    )
    SELECT id, member_id, type, content_id, value, duration_sec,
           sentiment, click_latency_ms, meta, ts, created_at
    FROM events
    WHERE created_at < NOW() - INTERVAL '90 days'
    RETURNING id
  )
  DELETE FROM events WHERE id IN (SELECT id FROM moved_events);
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Compute community analytics
CREATE OR REPLACE FUNCTION compute_community_analytics() RETURNS VOID AS $$
DECLARE
  v_total_members INTEGER;
  v_active_7d INTEGER;
  v_active_30d INTEGER;
  v_new_today INTEGER;
  v_tier_free INTEGER;
  v_tier_rebel INTEGER;
  v_tier_outlaw INTEGER;
  v_tier_legionnaire INTEGER;
  v_top_country TEXT;
  v_top_region TEXT;
  v_countries_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_members FROM user_profiles;
  SELECT COUNT(*) INTO v_active_7d FROM user_profiles WHERE last_active_at >= NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO v_active_30d FROM user_profiles WHERE last_active_at >= NOW() - INTERVAL '30 days';
  SELECT COUNT(*) INTO v_new_today FROM user_profiles WHERE created_at >= CURRENT_DATE;
  
  SELECT COUNT(*) INTO v_tier_free FROM user_profiles WHERE LOWER(COALESCE(membership_tier, tier, 'free')) LIKE '%free%';
  SELECT COUNT(*) INTO v_tier_rebel FROM user_profiles WHERE LOWER(COALESCE(membership_tier, tier, '')) LIKE '%rebel%';
  SELECT COUNT(*) INTO v_tier_outlaw FROM user_profiles WHERE LOWER(COALESCE(membership_tier, tier, '')) LIKE '%outlaw%';
  SELECT COUNT(*) INTO v_tier_legionnaire FROM user_profiles WHERE LOWER(COALESCE(membership_tier, tier, '')) LIKE '%legionnaire%';
  
  SELECT country INTO v_top_country FROM user_profiles WHERE country IS NOT NULL GROUP BY country ORDER BY COUNT(*) DESC LIMIT 1;
  SELECT region INTO v_top_region FROM user_profiles WHERE region IS NOT NULL GROUP BY region ORDER BY COUNT(*) DESC LIMIT 1;
  SELECT COUNT(DISTINCT country) INTO v_countries_count FROM user_profiles WHERE country IS NOT NULL;
  
  INSERT INTO community_analytics (
    id, total_members, active_members_7d, active_members_30d, new_members_today,
    tier_free, tier_rebel, tier_outlaw, tier_legionnaire,
    top_country, top_region, countries_count, computed_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    v_total_members, v_active_7d, v_active_30d, v_new_today,
    v_tier_free, v_tier_rebel, v_tier_outlaw, v_tier_legionnaire,
    v_top_country, v_top_region, v_countries_count, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    total_members = v_total_members,
    active_members_7d = v_active_7d,
    active_members_30d = v_active_30d,
    new_members_today = v_new_today,
    tier_free = v_tier_free,
    tier_rebel = v_tier_rebel,
    tier_outlaw = v_tier_outlaw,
    tier_legionnaire = v_tier_legionnaire,
    top_country = v_top_country,
    top_region = v_top_region,
    countries_count = v_countries_count,
    computed_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_music_tracks_updated_at BEFORE UPDATE ON music_tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_livestream_events_updated_at BEFORE UPDATE ON livestream_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cameos_updated_at BEFORE UPDATE ON cameos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cameo_requests_updated_at BEFORE UPDATE ON cameo_requests FOR EACH ROW EXECUTE FUNCTION update_cameo_requests_updated_at();
CREATE TRIGGER update_avatar_archetypes_updated_at BEFORE UPDATE ON avatar_archetypes FOR EACH ROW EXECUTE FUNCTION update_avatar_archetypes_updated_at();

-- Handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (
    user_id, email, display_name, membership_tier, created_at, updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'free',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Compute total minutes for milestones
CREATE OR REPLACE FUNCTION compute_total_minutes() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO milestone_progress (user_id, total_minutes, last_updated)
  VALUES (
    NEW.user_id,
    COALESCE(NEW.watch_time, 0) + COALESCE(NEW.listen_time, 0),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_minutes = COALESCE(NEW.watch_time, 0) + COALESCE(NEW.listen_time, 0),
    last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER compute_milestone_minutes
  AFTER INSERT OR UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION compute_total_minutes();

-- Check and award milestones
CREATE OR REPLACE FUNCTION check_and_award_milestones() RETURNS TRIGGER AS $$
DECLARE
  silver_threshold INTEGER := 210;
  gold_threshold INTEGER := 300;
  champion_threshold INTEGER := 420;
BEGIN
  -- Silver Star (210 minutes)
  IF NEW.total_minutes >= silver_threshold AND NOT EXISTS (
    SELECT 1 FROM user_milestones WHERE user_id = NEW.user_id AND milestone_type = 'silver_star'
  ) THEN
    INSERT INTO user_milestones (user_id, milestone_type, total_minutes_at_achievement)
    VALUES (NEW.user_id, 'silver_star', NEW.total_minutes);
    UPDATE milestone_progress SET current_badge = 'silver_star', next_milestone_minutes = gold_threshold WHERE user_id = NEW.user_id;
  END IF;

  -- Gold Star (300 minutes)
  IF NEW.total_minutes >= gold_threshold AND NOT EXISTS (
    SELECT 1 FROM user_milestones WHERE user_id = NEW.user_id AND milestone_type = 'gold_star'
  ) THEN
    INSERT INTO user_milestones (user_id, milestone_type, total_minutes_at_achievement)
    VALUES (NEW.user_id, 'gold_star', NEW.total_minutes);
    UPDATE milestone_progress SET current_badge = 'gold_star', next_milestone_minutes = champion_threshold WHERE user_id = NEW.user_id;
  END IF;

  -- Dunbar Champion (420 minutes)
  IF NEW.total_minutes >= champion_threshold AND NOT EXISTS (
    SELECT 1 FROM user_milestones WHERE user_id = NEW.user_id AND milestone_type = 'dunbar_champion'
  ) THEN
    INSERT INTO user_milestones (user_id, milestone_type, total_minutes_at_achievement)
    VALUES (NEW.user_id, 'dunbar_champion', NEW.total_minutes);
    UPDATE milestone_progress SET current_badge = 'medallion', next_milestone_minutes = NULL WHERE user_id = NEW.user_id;
  END IF;

  -- Set initial next_milestone
  IF NEW.next_milestone_minutes IS NULL AND NEW.current_badge IS NULL THEN
    UPDATE milestone_progress SET next_milestone_minutes = silver_threshold WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER award_milestones
  AFTER INSERT OR UPDATE ON milestone_progress
  FOR EACH ROW EXECUTE FUNCTION check_and_award_milestones();

-- Grant admin role on signup
CREATE OR REPLACE FUNCTION grant_admin_role_on_signup() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IN ('arock@sonsoflegion.com', 'sookz@me.com') THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER grant_admin_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION grant_admin_role_on_signup();

-- Auto-update user activity from events
CREATE OR REPLACE FUNCTION auto_update_user_activity() RETURNS TRIGGER AS $$
DECLARE
  event_duration INTEGER;
BEGIN
  IF NEW.member_id IS NOT NULL THEN
    event_duration := COALESCE((NEW.meta->>'duration')::INTEGER, 0);
    
    IF NEW.type IN ('video_watch', 'video_view') THEN
      UPDATE user_profiles
      SET watch_time = COALESCE(watch_time, 0) + event_duration, last_login = NOW()
      WHERE user_id = NEW.member_id;
    ELSIF NEW.type IN ('music_listen', 'music_play') THEN
      UPDATE user_profiles
      SET listen_time = COALESCE(listen_time, 0) + event_duration, last_login = NOW()
      WHERE user_id = NEW.member_id;
    ELSE
      UPDATE user_profiles SET last_login = NOW() WHERE user_id = NEW.member_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER track_user_activity
  AFTER INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION auto_update_user_activity();

-- Update livestream engagement
CREATE OR REPLACE FUNCTION update_livestream_engagement() RETURNS TRIGGER AS $$
DECLARE
  total_reactions INTEGER;
  hearts_count INTEGER;
  claps_count INTEGER;
  engagement_score NUMERIC;
  is_superfan BOOLEAN;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT 
      COUNT(*),
      COUNT(*) FILTER (WHERE reaction_type = 'heart'),
      COUNT(*) FILTER (WHERE reaction_type = 'clap')
    INTO total_reactions, hearts_count, claps_count
    FROM livestream_reactions
    WHERE user_id = NEW.user_id;
    
    engagement_score := (hearts_count * 2) + (claps_count * 1);
    is_superfan := (total_reactions >= 20 OR hearts_count >= 10 OR engagement_score >= 25);
    
    UPDATE user_profiles
    SET 
      livestream_reaction_count = total_reactions,
      livestream_hearts_sent = hearts_count,
      livestream_claps_sent = claps_count,
      livestream_engagement_score = engagement_score,
      is_super_fan = is_superfan,
      last_livestream_reaction = NEW.created_at,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_user_livestream_engagement
  AFTER INSERT ON livestream_reactions
  FOR EACH ROW EXECUTE FUNCTION update_livestream_engagement();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE era_ptp_scores_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_matrix_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_archetypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_best_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_data_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_targets_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalyst_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalyst_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalyst_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rule_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestream_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestream_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestream_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestream_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cameos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cameo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cameo_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_content_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE popup_displays ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_email_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ethos_performance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_send_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;

-- See STORAGE_POLICIES.sql for complete RLS policies (file too long to include here)

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default admin users
INSERT INTO platform_admins (user_id) 
SELECT id FROM auth.users WHERE email IN ('arock@sonsoflegion.com', 'sookz@me.com')
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run STORAGE_POLICIES.sql for storage RLS policies
-- 2. Configure secrets in Supabase dashboard
-- 3. Deploy edge functions
-- 4. Update frontend environment variables
-- =====================================================
