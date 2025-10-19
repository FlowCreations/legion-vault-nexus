-- Create event type enum
CREATE TYPE public.event_type AS ENUM (
  'watch_start',
  'watch_complete',
  'listen_start',
  'listen_complete',
  'page_view',
  'series_step',
  'reaction',
  'comment',
  'add_to_cart',
  'purchase',
  'reward_claim'
);

-- Create events table for behavioral tracking
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type event_type NOT NULL,
  content_id TEXT,
  duration_sec INTEGER,
  value NUMERIC DEFAULT 0,
  sentiment NUMERIC CHECK (sentiment >= -1 AND sentiment <= 1),
  click_latency_ms INTEGER,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_member_id ON public.events(member_id);
CREATE INDEX idx_events_ts ON public.events(ts);
CREATE INDEX idx_events_type ON public.events(type);

-- Create ERA/PTP scores table
CREATE TABLE public.era_ptp_scores_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  era INTEGER CHECK (era >= 1 AND era <= 10),
  ptp INTEGER CHECK (ptp >= 0 AND ptp <= 100),
  era_components JSONB,
  ptp_components JSONB,
  flags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, date)
);

CREATE INDEX idx_era_ptp_member_id ON public.era_ptp_scores_daily(member_id);
CREATE INDEX idx_era_ptp_date ON public.era_ptp_scores_daily(date);

-- Create cohorts table
CREATE TABLE public.cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  definition JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cohort members junction table
CREATE TABLE public.cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES public.cohorts(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_id, member_id)
);

CREATE INDEX idx_cohort_members_cohort ON public.cohort_members(cohort_id);
CREATE INDEX idx_cohort_members_member ON public.cohort_members(member_id);

-- Add ERA and PTP columns to user_profiles
ALTER TABLE public.user_profiles 
  ADD COLUMN era_current INTEGER CHECK (era_current >= 1 AND era_current <= 10),
  ADD COLUMN ptp_current INTEGER CHECK (ptp_current >= 0 AND ptp_current <= 100),
  ADD COLUMN era_label TEXT CHECK (era_label IN ('Dormant', 'Engaged', 'Tribe', 'Integrated')),
  ADD COLUMN ptp_status TEXT CHECK (ptp_status IN ('Cold', 'Warm', 'Hot'));

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.era_ptp_scores_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Merchants and admins can view all events"
  ON public.events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'merchant'::app_role));

CREATE POLICY "System can insert events"
  ON public.events FOR INSERT
  WITH CHECK (true);

-- RLS Policies for era_ptp_scores_daily
CREATE POLICY "Merchants and admins can view scores"
  ON public.era_ptp_scores_daily FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'merchant'::app_role));

CREATE POLICY "System can manage scores"
  ON public.era_ptp_scores_daily FOR ALL
  USING (true);

-- RLS Policies for cohorts
CREATE POLICY "Merchants and admins can view cohorts"
  ON public.cohorts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'merchant'::app_role));

CREATE POLICY "Merchants and admins can manage cohorts"
  ON public.cohorts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'merchant'::app_role));

-- RLS Policies for cohort_members
CREATE POLICY "Merchants and admins can view cohort members"
  ON public.cohort_members FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'merchant'::app_role));

CREATE POLICY "Merchants and admins can manage cohort members"
  ON public.cohort_members FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'merchant'::app_role));