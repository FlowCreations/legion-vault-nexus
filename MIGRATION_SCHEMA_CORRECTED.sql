-- =============================================
-- SONS OF LEGION - COMPLETE DATABASE SCHEMA
-- Supabase Pro Migration Script (CORRECTED)
-- =============================================

-- =============================================
-- 1. CUSTOM TYPES (MUST COME FIRST)
-- =============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'merchant', 'user');
CREATE TYPE public.event_type AS ENUM (
  'page_view', 'video_view', 'music_play', 'chat_message',
  'profile_update', 'purchase', 'signup', 'login',
  'video_watch', 'music_listen', 'content_share',
  'comment_post', 'reaction_add', 'search_query',
  'cart_add', 'cart_abandon', 'checkout_start', 'checkout_complete'
);

-- =============================================
-- 2. CORE USER TABLES
-- =============================================

CREATE TABLE public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  membership_tier TEXT DEFAULT 'free',
  tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  monthly_recurring_revenue NUMERIC(10,2) DEFAULT 0,
  lifetime_value NUMERIC(10,2) DEFAULT 0,
  watch_time INTEGER DEFAULT 0,
  listen_time INTEGER DEFAULT 0,
  last_login TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  country TEXT,
  region TEXT,
  city TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  timezone TEXT,
  locale TEXT DEFAULT 'en-US',
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  marketing_opt_in BOOLEAN DEFAULT TRUE,
  sms_opt_in BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  referral_code TEXT,
  referred_by UUID,
  total_referrals INTEGER DEFAULT 0,
  is_super_fan BOOLEAN DEFAULT FALSE,
  livestream_reaction_count INTEGER DEFAULT 0,
  livestream_hearts_sent INTEGER DEFAULT 0,
  livestream_claps_sent INTEGER DEFAULT 0,
  livestream_engagement_score NUMERIC(10,2) DEFAULT 0,
  last_livestream_reaction TIMESTAMPTZ,
  social_links JSONB DEFAULT '{}'
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE TABLE public.milestone_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_minutes INTEGER DEFAULT 0,
  current_badge TEXT,
  next_milestone_minutes INTEGER,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  total_minutes_at_achievement INTEGER NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.personality_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  mbti_type TEXT,
  openness_score NUMERIC(3,2),
  conscientiousness_score NUMERIC(3,2),
  extraversion_score NUMERIC(3,2),
  agreeableness_score NUMERIC(3,2),
  neuroticism_score NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_behavior_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_content_types JSONB DEFAULT '[]',
  engagement_patterns JSONB DEFAULT '{}',
  purchase_behavior JSONB DEFAULT '{}',
  interaction_frequency TEXT,
  session_duration_avg INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. INTELLIGENCE & SCORING TABLES
-- =============================================

CREATE TABLE public.era_ptp_scores_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  score_date DATE NOT NULL,
  ptp_score NUMERIC(5,2),
  ptp_status TEXT,
  era_score NUMERIC(5,2),
  era_label TEXT,
  engagement_level TEXT,
  conversion_probability NUMERIC(3,2),
  recommended_actions JSONB DEFAULT '[]',
  calculation_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, score_date)
);

CREATE TABLE public.match_matrix_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  compatibility_score NUMERIC(5,2),
  shared_interests JSONB DEFAULT '[]',
  interaction_history JSONB DEFAULT '{}',
  match_strength TEXT,
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.avatar_archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_name TEXT UNIQUE NOT NULL,
  description TEXT,
  core_demographic JSONB DEFAULT '{}',
  psychographic_personality JSONB DEFAULT '{}',
  behavioral_patterns JSONB DEFAULT '{}',
  emotional_energy_profile JSONB DEFAULT '{}',
  socioeconomic_context JSONB DEFAULT '{}',
  cultural_symbolic_affinities JSONB DEFAULT '{}',
  experiential_aspirational JSONB DEFAULT '{}',
  predictive_signals JSONB DEFAULT '{}',
  conversion_predictions JSONB DEFAULT '{}',
  member_count INTEGER DEFAULT 0,
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.next_best_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_description TEXT,
  priority INTEGER,
  expected_impact NUMERIC(3,2),
  context JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. EVENTS & ANALYTICS TABLES
-- =============================================

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  event_type public.event_type NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.events_archive (
  id UUID PRIMARY KEY,
  user_id UUID,
  event_type public.event_type,
  event_data JSONB,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_properties JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.behavioral_data_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE UNIQUE DEFAULT CURRENT_DATE,
  discover_count INTEGER DEFAULT 0,
  engage_count INTEGER DEFAULT 0,
  invest_count INTEGER DEFAULT 0,
  loyal_count INTEGER DEFAULT 0,
  high_ptp_count INTEGER DEFAULT 0,
  avg_ptp_score NUMERIC(5,2),
  avg_era_score NUMERIC(5,2),
  avg_session_duration_sec INTEGER,
  avg_content_consumed_minutes INTEGER,
  purchases INTEGER DEFAULT 0,
  cart_additions INTEGER DEFAULT 0,
  cart_abandonments INTEGER DEFAULT 0,
  journey_transitions JSONB DEFAULT '{}',
  total_searches INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  top_search_terms JSONB DEFAULT '[]',
  top_discussed_topics JSONB DEFAULT '[]',
  ptp_calculation_details JSONB DEFAULT '{}',
  era_calculation_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. MARKETING & CAMPAIGNS
-- =============================================

CREATE TABLE public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT,
  target_segment JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  analytics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.campaign_targets_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  ptp_score NUMERIC(5,2) NOT NULL,
  ptp_status TEXT NOT NULL,
  personalization_data JSONB DEFAULT '{}',
  message_sent_at TIMESTAMPTZ,
  message_opened_at TIMESTAMPTZ,
  message_clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  revenue_generated NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.campaign_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  message_content JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.catalyst_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_type TEXT NOT NULL,
  target_segment TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  message_template TEXT NOT NULL,
  offer_type TEXT,
  offer_value JSONB,
  priority INTEGER DEFAULT 0,
  max_sends_per_user INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.catalyst_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.catalyst_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  segment TEXT,
  ptp_score NUMERIC(5,2),
  era_score NUMERIC(5,2),
  message_sent TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  conversion_value NUMERIC(10,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.catalyst_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.catalyst_campaigns(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  open_rate NUMERIC(5,2),
  click_rate NUMERIC(5,2),
  conversion_rate NUMERIC(5,2),
  avg_conversion_value NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_body TEXT NOT NULL,
  preview_text TEXT,
  sms_body TEXT,
  sms_enabled BOOLEAN DEFAULT FALSE,
  channel_type TEXT DEFAULT 'email',
  campaign_type TEXT DEFAULT 'one-time',
  campaign_goal TEXT,
  objective TEXT,
  tone TEXT,
  target_segment JSONB DEFAULT '{}',
  list_id UUID,
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  send_immediately BOOLEAN DEFAULT FALSE,
  ai_generated BOOLEAN DEFAULT FALSE,
  ethos_score NUMERIC(3,2),
  manipulation_flags INTEGER DEFAULT 0,
  love_first_validation BOOLEAN DEFAULT TRUE,
  analytics JSONB DEFAULT '{}',
  test_duration INTEGER,
  winner_criteria TEXT,
  campaign_duration_days INTEGER,
  conversion_goal_type TEXT,
  conversion_tracked BOOLEAN DEFAULT FALSE,
  max_sends_per_user INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.email_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  filter_rules JSONB DEFAULT '{}',
  member_count INTEGER DEFAULT 0,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  send_sequence_number INTEGER,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  bounced BOOLEAN DEFAULT FALSE,
  bounce_reason TEXT,
  spam_reported_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_type)
);

-- =============================================
-- 6. AUTOMATION TABLES
-- =============================================

CREATE TABLE public.automation_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_rules JSONB DEFAULT '{}',
  steps JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.automation_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES public.automation_sequences(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  current_step_index INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  exit_reason TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE public.automation_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.automation_enrollments(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  step_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  cooldown_hours INTEGER,
  max_sends_per_user INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.automation_rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'success',
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  conversion_value NUMERIC(10,2),
  metadata JSONB DEFAULT '{}'
);

-- =============================================
-- 7. E-COMMERCE TABLES
-- =============================================

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC(10,2),
  stock_quantity INTEGER DEFAULT 0,
  variant_options JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  shipping_address JSONB,
  billing_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_payment_id TEXT,
  status TEXT DEFAULT 'completed',
  metadata JSONB DEFAULT '{}',
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  cart_items JSONB NOT NULL,
  cart_value NUMERIC(10,2),
  status TEXT DEFAULT 'abandoned',
  discount_code TEXT,
  discount_percentage NUMERIC(5,2),
  email_sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cart_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  session_id TEXT,
  cart_items JSONB NOT NULL,
  cart_value NUMERIC(10,2),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. LIVE STREAMING TABLES
-- =============================================

CREATE TABLE public.livestream_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  livekit_room_name TEXT,
  stream_url TEXT,
  thumbnail_url TEXT,
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  created_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.livestream_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.livestream_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  timestamp_ms BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.livestream_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.livestream_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.livestream_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.livestream_events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 9. CONTENT TABLES
-- =============================================

CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  category TEXT,
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.music_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  album TEXT,
  audio_url TEXT NOT NULL,
  cover_image_url TEXT,
  duration_seconds INTEGER,
  genre TEXT,
  release_date DATE,
  spotify_id TEXT,
  apple_music_id TEXT,
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  link_url TEXT,
  post_type TEXT DEFAULT 'text',
  category TEXT,
  tagged_all BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- =============================================
-- 10. CAMEO TABLES
-- =============================================

CREATE TABLE public.cameos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  recipient_user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  recipient_manual_name TEXT,
  message_type TEXT NOT NULL,
  message_text TEXT,
  video_url TEXT,
  video_thumbnail_url TEXT,
  display_duration TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cameo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  requester_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  occasion_type TEXT NOT NULL,
  special_instructions TEXT,
  requested_delivery_date DATE,
  price_paid NUMERIC(10,2) DEFAULT 49.99,
  payment_status TEXT DEFAULT 'pending',
  stripe_payment_id TEXT,
  stripe_checkout_session_id TEXT,
  fulfillment_status TEXT DEFAULT 'pending',
  completed_cameo_id UUID REFERENCES public.cameos(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cameo_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cameo_id UUID REFERENCES public.cameos(id) ON DELETE CASCADE,
  recipient_user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  notification_type TEXT DEFAULT 'new_cameo',
  email_enabled BOOLEAN DEFAULT TRUE,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. FUNNEL & AB TESTING TABLES
-- =============================================

CREATE TABLE public.funnel_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name TEXT NOT NULL,
  page_url TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.funnel_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  current_step INTEGER DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.funnel_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.funnel_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  converted_at TIMESTAMPTZ DEFAULT NOW(),
  conversion_value NUMERIC(10,2),
  conversion_type TEXT
);

CREATE TABLE public.ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_name TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  views INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2),
  avg_order_value NUMERIC(10,2),
  total_revenue NUMERIC(10,2),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ab_test_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID,
  variant_name TEXT NOT NULL,
  subject_line TEXT,
  email_body TEXT,
  traffic_percentage NUMERIC(5,2),
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  campaign_id UUID,
  variant_id UUID REFERENCES public.ab_test_variants(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 12. COMMUNITY ANALYTICS
-- =============================================

CREATE TABLE public.community_analytics (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  total_members INTEGER DEFAULT 0,
  active_members_7d INTEGER DEFAULT 0,
  active_members_30d INTEGER DEFAULT 0,
  new_members_today INTEGER DEFAULT 0,
  tier_free INTEGER DEFAULT 0,
  tier_rebel INTEGER DEFAULT 0,
  tier_outlaw INTEGER DEFAULT 0,
  tier_legionnaire INTEGER DEFAULT 0,
  total_mrr NUMERIC(10,2) DEFAULT 0,
  avg_ltv NUMERIC(10,2) DEFAULT 0,
  top_country TEXT,
  top_region TEXT,
  countries_count INTEGER DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 13. AFFILIATES TABLES
-- =============================================

CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  ethos TEXT,
  non_negotiables TEXT[],
  social_links JSONB DEFAULT '{}',
  analytics JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.affiliate_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT DEFAULT 'music',
  content_url TEXT,
  thumbnail_url TEXT,
  spotify_track_id TEXT,
  spotify_artist_id TEXT,
  spotify_album_id TEXT,
  artist_name TEXT,
  album_name TEXT,
  release_date DATE,
  duration_ms INTEGER,
  click_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.affiliate_content_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.affiliate_content(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 14. MULTI-TENANCY TABLES
-- =============================================

CREATE TABLE public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.tenant_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, tenant_id)
);

CREATE TABLE public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 15. ADDITIONAL UTILITY TABLES
-- =============================================

CREATE TABLE public.scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.popup_displays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  popup_type TEXT NOT NULL,
  displayed_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT FALSE
);

CREATE TABLE public.agent_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  agent_response TEXT NOT NULL,
  user_message TEXT,
  behavior_context JSONB,
  emotional_state TEXT,
  engagement_level TEXT,
  sent_at TIMESTAMPTZ,
  response_delay_minutes INTEGER,
  user_clicked_cta BOOLEAN,
  user_dismissed BOOLEAN,
  interaction_outcome TEXT,
  conversion_resulted BOOLEAN,
  conversion_value NUMERIC(10,2),
  conversion_event_id UUID REFERENCES public.events(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ai_email_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL,
  insight_title TEXT NOT NULL,
  insight_description TEXT NOT NULL,
  insight_data JSONB,
  confidence_score NUMERIC(3,2),
  actionable_steps JSONB,
  applied_at TIMESTAMPTZ,
  result_metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ethos_performance_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID,
  ethos_score NUMERIC(3,2) NOT NULL,
  manipulation_flags INTEGER DEFAULT 0,
  open_rate NUMERIC(5,2),
  click_rate NUMERIC(5,2),
  conversion_rate NUMERIC(5,2),
  unsubscribe_rate NUMERIC(5,2),
  user_satisfaction_score NUMERIC(3,2),
  tracked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_send_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  max_emails_per_week INTEGER DEFAULT 3,
  max_sms_per_week INTEGER DEFAULT 1,
  preferred_send_times JSONB DEFAULT '[]',
  timezone TEXT DEFAULT 'UTC',
  unsubscribed_from_marketing BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  definition JSONB NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES public.cohorts(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 16. DATABASE FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.calculate_distance_miles(
  lat1 NUMERIC, lon1 NUMERIC, lat2 NUMERIC, lon2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R NUMERIC := 3959; -- Earth's radius in miles
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
$$;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.tenant_id', true)::uuid,
    (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::uuid
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_tenant_context(_tenant_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.tenant_id', _tenant_id::text, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_admins 
    WHERE user_id = _user_id 
      AND tenant_id = _tenant_id
      AND accepted_at IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins 
    WHERE user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.update_user_coordinates(
  p_user_id UUID, p_latitude NUMERIC, p_longitude NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    latitude = p_latitude,
    longitude = p_longitude,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_watch_time(p_user_id UUID, p_duration INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    watch_time = COALESCE(watch_time, 0) + p_duration,
    last_login = NOW()
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_listen_time(p_user_id UUID, p_duration INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    listen_time = COALESCE(listen_time, 0) + p_duration,
    last_login = NOW()
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_affiliate_content_click(
  p_content_id UUID, p_user_id UUID DEFAULT NULL, p_session_id TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL, p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.affiliate_content_clicks (
    content_id, user_id, session_id, referrer, user_agent
  ) VALUES (
    p_content_id, p_user_id, p_session_id, p_referrer, p_user_agent
  );
  
  UPDATE public.affiliate_content 
  SET 
    click_count = COALESCE(click_count, 0) + 1,
    last_clicked_at = NOW()
  WHERE id = p_content_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_old_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  archived_count integer;
BEGIN
  WITH moved_events AS (
    INSERT INTO public.events_archive (
      id, user_id, event_type, event_data, session_id,
      ip_address, user_agent, referrer, created_at
    )
    SELECT 
      id, user_id, event_type, event_data, session_id,
      ip_address, user_agent, referrer, created_at
    FROM public.events
    WHERE created_at < NOW() - INTERVAL '90 days'
    RETURNING id
  )
  DELETE FROM public.events
  WHERE id IN (SELECT id FROM moved_events);
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  RETURN archived_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_community_analytics()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  SELECT COUNT(*) INTO v_total_members FROM public.user_profiles;
  
  SELECT COUNT(*) INTO v_active_7d 
  FROM public.user_profiles 
  WHERE last_active_at >= NOW() - INTERVAL '7 days';
  
  SELECT COUNT(*) INTO v_active_30d 
  FROM public.user_profiles 
  WHERE last_active_at >= NOW() - INTERVAL '30 days';
  
  SELECT COUNT(*) INTO v_new_today 
  FROM public.user_profiles 
  WHERE created_at >= CURRENT_DATE;
  
  SELECT COUNT(*) INTO v_tier_free 
  FROM public.user_profiles 
  WHERE LOWER(COALESCE(membership_tier, tier, 'free')) LIKE '%free%';
  
  SELECT COUNT(*) INTO v_tier_rebel 
  FROM public.user_profiles 
  WHERE LOWER(COALESCE(membership_tier, tier, '')) LIKE '%rebel%';
  
  SELECT COUNT(*) INTO v_tier_outlaw 
  FROM public.user_profiles 
  WHERE LOWER(COALESCE(membership_tier, tier, '')) LIKE '%outlaw%';
  
  SELECT COUNT(*) INTO v_tier_legionnaire 
  FROM public.user_profiles 
  WHERE LOWER(COALESCE(membership_tier, tier, '')) LIKE '%legionnaire%';
  
  SELECT country INTO v_top_country
  FROM public.user_profiles 
  WHERE country IS NOT NULL 
  GROUP BY country 
  ORDER BY COUNT(*) DESC 
  LIMIT 1;
  
  SELECT region INTO v_top_region
  FROM public.user_profiles 
  WHERE region IS NOT NULL 
  GROUP BY region 
  ORDER BY COUNT(*) DESC 
  LIMIT 1;
  
  SELECT COUNT(DISTINCT country) INTO v_countries_count 
  FROM public.user_profiles 
  WHERE country IS NOT NULL;
  
  INSERT INTO public.community_analytics (
    id, total_members, active_members_7d, active_members_30d,
    new_members_today, tier_free, tier_rebel, tier_outlaw,
    tier_legionnaire, top_country, top_region, countries_count,
    computed_at, updated_at
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
$$;

-- =============================================
-- 17. TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_avatar_archetypes_updated_at
  BEFORE UPDATE ON public.avatar_archetypes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cameo_requests_updated_at
  BEFORE UPDATE ON public.cameo_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id, email, display_name, membership_tier, created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'free', NOW(), NOW()
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.compute_total_minutes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.milestone_progress (user_id, total_minutes, last_updated)
  VALUES (
    NEW.user_id,
    COALESCE(NEW.watch_time, 0) + COALESCE(NEW.listen_time, 0),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    total_minutes = COALESCE(NEW.watch_time, 0) + COALESCE(NEW.listen_time, 0),
    last_updated = NOW();
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER compute_milestone_progress
  AFTER INSERT OR UPDATE OF watch_time, listen_time ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_total_minutes();

CREATE OR REPLACE FUNCTION public.check_and_award_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  silver_threshold INTEGER := 210;
  gold_threshold INTEGER := 300;
  champion_threshold INTEGER := 420;
BEGIN
  IF NEW.total_minutes >= silver_threshold 
     AND NOT EXISTS (
       SELECT 1 FROM public.user_milestones 
       WHERE user_id = NEW.user_id AND milestone_type = 'silver_star'
     ) THEN
    INSERT INTO public.user_milestones (user_id, milestone_type, total_minutes_at_achievement)
    VALUES (NEW.user_id, 'silver_star', NEW.total_minutes);
    
    UPDATE public.milestone_progress 
    SET current_badge = 'silver_star', next_milestone_minutes = gold_threshold
    WHERE user_id = NEW.user_id;
  END IF;

  IF NEW.total_minutes >= gold_threshold 
     AND NOT EXISTS (
       SELECT 1 FROM public.user_milestones 
       WHERE user_id = NEW.user_id AND milestone_type = 'gold_star'
     ) THEN
    INSERT INTO public.user_milestones (user_id, milestone_type, total_minutes_at_achievement)
    VALUES (NEW.user_id, 'gold_star', NEW.total_minutes);
    
    UPDATE public.milestone_progress 
    SET current_badge = 'gold_star', next_milestone_minutes = champion_threshold
    WHERE user_id = NEW.user_id;
  END IF;

  IF NEW.total_minutes >= champion_threshold 
     AND NOT EXISTS (
       SELECT 1 FROM public.user_milestones 
       WHERE user_id = NEW.user_id AND milestone_type = 'dunbar_champion'
     ) THEN
    INSERT INTO public.user_milestones (user_id, milestone_type, total_minutes_at_achievement)
    VALUES (NEW.user_id, 'dunbar_champion', NEW.total_minutes);
    
    UPDATE public.milestone_progress 
    SET current_badge = 'medallion', next_milestone_minutes = NULL
    WHERE user_id = NEW.user_id;
  END IF;

  IF NEW.next_milestone_minutes IS NULL AND NEW.current_badge IS NULL THEN
    UPDATE public.milestone_progress 
    SET next_milestone_minutes = silver_threshold
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER award_milestones
  AFTER INSERT OR UPDATE ON public.milestone_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_award_milestones();

CREATE OR REPLACE FUNCTION public.grant_admin_role_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.email IN ('arock@sonsoflegion.com', 'sookz@me.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER grant_admin_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_admin_role_on_signup();

CREATE OR REPLACE FUNCTION public.auto_update_user_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  event_duration INTEGER;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    event_duration := COALESCE((NEW.event_data->>'duration')::integer, 0);
    
    IF NEW.event_type IN ('video_watch', 'video_view') THEN
      UPDATE public.user_profiles
      SET 
        watch_time = COALESCE(watch_time, 0) + event_duration,
        last_login = NOW()
      WHERE user_id = NEW.user_id;
    ELSIF NEW.event_type IN ('music_listen', 'music_play') THEN
      UPDATE public.user_profiles
      SET 
        listen_time = COALESCE(listen_time, 0) + event_duration,
        last_login = NOW()
      WHERE user_id = NEW.user_id;
    ELSE
      UPDATE public.user_profiles
      SET last_login = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_user_activity
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_user_activity();

CREATE OR REPLACE FUNCTION public.update_livestream_engagement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
    FROM public.livestream_reactions
    WHERE user_id = NEW.user_id;
    
    engagement_score := (hearts_count * 2) + (claps_count * 1);
    
    is_superfan := (
      total_reactions >= 20 OR 
      hearts_count >= 10 OR 
      engagement_score >= 25
    );
    
    UPDATE public.user_profiles
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
$$;

CREATE TRIGGER update_user_livestream_engagement
  AFTER INSERT ON public.livestream_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_livestream_engagement();

-- =============================================
-- 18. ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.era_ptp_scores_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_matrix_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_archetypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.next_best_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_data_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_targets_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalyst_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalyst_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalyst_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rule_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestream_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestream_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestream_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestream_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameo_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_content_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_displays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_email_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ethos_performance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_send_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_members ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (users can view/edit their own data)
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own milestones" ON public.user_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own milestone progress" ON public.milestone_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins have full access to user_profiles" ON public.user_profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins have full access to all tables" ON public.marketing_campaigns
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 19. INITIAL DATA
-- =============================================

INSERT INTO public.platform_admins (user_id)
SELECT id FROM auth.users WHERE email IN ('arock@sonsoflegion.com', 'sookz@me.com')
ON CONFLICT DO NOTHING;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
