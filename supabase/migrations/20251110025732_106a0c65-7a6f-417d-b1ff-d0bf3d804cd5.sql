-- Create ptp_behavior_weights table
CREATE TABLE IF NOT EXISTS public.ptp_behavior_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  behavior_key TEXT UNIQUE NOT NULL,
  behavior_name TEXT NOT NULL,
  weight INTEGER NOT NULL,
  zone TEXT NOT NULL CHECK (zone IN ('red', 'yellow', 'green')),
  tier TEXT NOT NULL CHECK (tier IN ('passive', 'exploratory', 'interactive', 'transactional', 'emotional_committed')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create ptp_behavior_log table
CREATE TABLE IF NOT EXISTS public.ptp_behavior_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  behavior_key TEXT NOT NULL,
  points_awarded INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add new columns to user_profiles
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_date DATE,
  ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inactive_days INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.ptp_behavior_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ptp_behavior_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ptp_behavior_weights
CREATE POLICY "Everyone can view behavior weights"
  ON public.ptp_behavior_weights
  FOR SELECT
  USING (true);

CREATE POLICY "Merchants and admins can manage behavior weights"
  ON public.ptp_behavior_weights
  FOR ALL
  USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for ptp_behavior_log
CREATE POLICY "Users can view their own behavior logs"
  ON public.ptp_behavior_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage behavior logs"
  ON public.ptp_behavior_log
  FOR ALL
  USING (true);

-- Seed RED ZONE behaviors (0-33 points)
INSERT INTO public.ptp_behavior_weights (behavior_key, behavior_name, weight, zone, tier, description) VALUES
('login_infrequent', 'Logs in fewer than 3 times in 30 days', 1, 'red', 'passive', 'Minimal login activity'),
('low_time_spent', 'Spends less than 10 min total on site per week', 2, 'red', 'passive', 'Very low engagement time'),
('few_songs_played', 'Plays fewer than 2 full songs', 3, 'red', 'passive', 'Minimal music listening'),
('merch_view_no_click', 'Views merch page, no clicks', 2, 'red', 'passive', 'Browsing without interaction'),
('community_view_no_post', 'Visits Community without posting', 2, 'red', 'passive', 'Passive community observation'),
('video_partial_view', 'Views 1-2 videos without finishing', 3, 'red', 'passive', 'Incomplete video engagement'),
('no_engagement', 'No likes/comments', 1, 'red', 'passive', 'Zero social engagement'),
('no_favorites', 'Doesn''t add any item to favorites', 2, 'red', 'passive', 'No favoriting behavior'),
('ad_only_visit', 'Visits only via ad link', 2, 'red', 'passive', 'Single-source traffic'),
('email_open_no_click', 'Opens but doesn''t click email', 1, 'red', 'passive', 'Email opened without engagement'),
('show_view_no_ticket', 'Views Shows page, no ticket clicks', 2, 'red', 'passive', 'Browsing shows without intent'),
('bio_only_view', 'Clicks About/Bio only', 1, 'red', 'passive', 'Minimal exploration'),
('quick_bounce', 'Bounces in under 30 sec', -2, 'red', 'passive', 'Immediate exit'),
('no_rsvp', 'Doesn''t RSVP to Live Studio', 2, 'red', 'passive', 'No event registration'),
('no_profile_complete', 'Doesn''t complete sign-in or profile', 0, 'red', 'passive', 'Incomplete account setup');

-- Seed YELLOW ZONE behaviors (34-66 points)
INSERT INTO public.ptp_behavior_weights (behavior_key, behavior_name, weight, zone, tier, description) VALUES
('login_weekly', 'Logs in weekly', 5, 'yellow', 'exploratory', 'Regular weekly visits'),
('moderate_time_spent', 'Spends 10-40 minutes per week', 6, 'yellow', 'exploratory', 'Moderate engagement time'),
('multiple_songs_partial', 'Plays multiple songs (partial skips)', 6, 'yellow', 'exploratory', 'Exploring music catalog'),
('favorites_created', 'Creates small favorites list', 8, 'yellow', 'interactive', 'Curating content'),
('video_complete_multiple', 'Watches 3-4 videos fully', 8, 'yellow', 'interactive', 'Regular video consumption'),
('comment_occasional', 'Comments once or twice', 7, 'yellow', 'interactive', 'Occasional engagement'),
('community_likes', 'Likes/reacts on Community posts', 6, 'yellow', 'interactive', 'Social validation'),
('cart_add_no_checkout', 'Adds item to cart but no checkout', 10, 'yellow', 'transactional', 'Purchase consideration'),
('merch_read_details', 'Reads merch descriptions', 5, 'yellow', 'exploratory', 'Product research'),
('show_ticket_click', 'Views Shows & clicks Get Tickets', 10, 'yellow', 'transactional', 'Event interest'),
('rsvp_no_attend', 'Registers for Live Studio (no attend)', 8, 'yellow', 'transactional', 'Event registration without follow-through'),
('email_half_open', 'Opens 50%+ of emails', 7, 'yellow', 'interactive', 'Moderate email engagement'),
('direct_return', 'Returns via direct link', 6, 'yellow', 'exploratory', 'Bookmark or direct traffic'),
('email_link_click', 'Follows email link to song', 7, 'yellow', 'interactive', 'Email-driven engagement'),
('partial_doc_watch', 'Watches half of a doc or BTS clip', 6, 'yellow', 'exploratory', 'Partial content consumption'),
('multi_section_visit', 'Visits 3+ sections in one session', 7, 'yellow', 'exploratory', 'Site exploration'),
('free_download', 'Downloads free track', 8, 'yellow', 'transactional', 'Content acquisition'),
('share_once', 'Shares a link externally once', 7, 'yellow', 'interactive', 'Single share action'),
('countdown_watch', 'Watches event countdown or reminder', 6, 'yellow', 'exploratory', 'Event anticipation');

-- Seed GREEN ZONE behaviors (67-100 points)
INSERT INTO public.ptp_behavior_weights (behavior_key, behavior_name, weight, zone, tier, description) VALUES
('login_frequent', 'Logs in 2+ times weekly', 10, 'green', 'interactive', 'High login frequency'),
('high_time_spent', 'Spends >60 minutes weekly', 12, 'green', 'emotional_committed', 'Deep engagement'),
('album_streams', 'Streams full albums multiple times', 15, 'green', 'emotional_committed', 'Heavy music listener'),
('merch_revisit', 'Clicks & revisits merch products', 10, 'green', 'transactional', 'Repeated product interest'),
('cart_multiple_adds', 'Adds items to cart twice or more', 15, 'green', 'transactional', 'Multiple purchase considerations'),
('video_complete_many', 'Watches 5+ full videos', 10, 'green', 'emotional_committed', 'Heavy video consumer'),
('active_comments', 'Comments/replies actively', 10, 'green', 'interactive', 'Active community participation'),
('poll_participation', 'Participates in polls/surveys', 8, 'green', 'interactive', 'Feedback and engagement'),
('livestream_rsvp_attend', 'RSVPs and attends Live Studio', 15, 'green', 'emotional_committed', 'Event commitment'),
('full_livestream_watch', 'Completes full acoustic/live stream', 12, 'green', 'emotional_committed', 'Live event engagement'),
('content_rewatch', 'Rewatches or replays content', 8, 'green', 'emotional_committed', 'Deep content appreciation'),
('email_high_open', 'Opens >80% of emails', 10, 'green', 'interactive', 'High email engagement'),
('checkout_page_view', 'Clicks checkout page (no purchase)', 15, 'green', 'transactional', 'Near-purchase behavior'),
('share_multiple', 'Shares multiple links on social', 10, 'green', 'interactive', 'Active promotion'),
('multi_platform_use', 'Uses both desktop & mobile', 5, 'green', 'interactive', 'Multi-device engagement'),
('purchase_digital', 'Purchases digital album or gift card', 20, 'green', 'emotional_committed', 'Conversion event'),
('reaction_engagement', 'Engages with reactions/replies', 8, 'green', 'interactive', 'Social interaction'),
('promo_linger', 'Visits during promo and lingers >5 min', 10, 'green', 'transactional', 'Promotional interest'),
('cart_payment_abandon', 'Adds to cart but exits on payment page', 15, 'green', 'transactional', 'Checkout abandonment');

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ptp_behavior_log_user_id ON public.ptp_behavior_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ptp_behavior_log_created_at ON public.ptp_behavior_log(created_at);
CREATE INDEX IF NOT EXISTS idx_ptp_behavior_weights_zone ON public.ptp_behavior_weights(zone);