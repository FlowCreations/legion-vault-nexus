-- Phase 1: Critical Security & Data Integrity Fixes

-- 1. Enable RLS on community_analytics table
ALTER TABLE public.community_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to aggregated stats
CREATE POLICY "Public can view community analytics"
ON public.community_analytics
FOR SELECT
USING (true);

-- Create policy for merchants/admins to manage analytics
CREATE POLICY "Merchants can manage community analytics"
ON public.community_analytics
FOR ALL
USING (
  has_role(auth.uid(), 'merchant'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- 2. Create events archive table for old events
CREATE TABLE IF NOT EXISTS public.events_archive (
  id uuid PRIMARY KEY,
  member_id uuid,
  type event_type NOT NULL,
  content_id text,
  value numeric DEFAULT 0,
  duration_sec integer,
  sentiment numeric,
  click_latency_ms integer,
  meta jsonb,
  ts timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  archived_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on archive table
ALTER TABLE public.events_archive ENABLE ROW LEVEL SECURITY;

-- Archive table policies (read-only for admins/merchants)
CREATE POLICY "Merchants can view archived events"
ON public.events_archive
FOR SELECT
USING (
  has_role(auth.uid(), 'merchant'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Add index on events.created_at for efficient archival
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at);

-- Add critical performance indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_coordinates 
ON public.user_profiles(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_user_created 
ON public.events(member_id, created_at DESC);

-- 4. Create function to archive old events (90+ days)
CREATE OR REPLACE FUNCTION public.archive_old_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  archived_count integer;
BEGIN
  -- Move events older than 90 days to archive
  WITH moved_events AS (
    INSERT INTO public.events_archive (
      id, member_id, type, content_id, value, duration_sec, 
      sentiment, click_latency_ms, meta, ts, created_at
    )
    SELECT 
      id, member_id, type, content_id, value, duration_sec,
      sentiment, click_latency_ms, meta, ts, created_at
    FROM public.events
    WHERE created_at < NOW() - INTERVAL '90 days'
    RETURNING id
  )
  DELETE FROM public.events
  WHERE id IN (SELECT id FROM moved_events)
  RETURNING id INTO archived_count;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  RETURN archived_count;
END;
$$;

-- 5. Fix security warnings on existing functions - add SET search_path
CREATE OR REPLACE FUNCTION public.update_user_coordinates(p_user_id uuid, p_latitude numeric, p_longitude numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.increment_watch_time(p_user_id uuid, p_duration integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    watch_time = COALESCE(watch_time, 0) + p_duration,
    last_login = NOW()
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_listen_time(p_user_id uuid, p_duration integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  p_content_id uuid, 
  p_user_id uuid DEFAULT NULL, 
  p_session_id text DEFAULT NULL, 
  p_referrer text DEFAULT NULL, 
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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