-- Create database functions for incrementing watch/listen time
CREATE OR REPLACE FUNCTION increment_watch_time(p_user_id uuid, p_duration integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_profiles
  SET 
    watch_time = COALESCE(watch_time, 0) + p_duration,
    last_login = NOW()
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_listen_time(p_user_id uuid, p_duration integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_profiles
  SET 
    listen_time = COALESCE(listen_time, 0) + p_duration,
    last_login = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Create trigger to auto-update user_profiles on user_events insert
CREATE OR REPLACE FUNCTION auto_update_user_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_duration integer;
BEGIN
  -- Only process if user_id is present
  IF NEW.user_id IS NOT NULL THEN
    -- Extract duration from event_data if present
    event_duration := COALESCE((NEW.event_data->>'duration')::integer, 0);
    
    -- Update based on event type
    IF NEW.event_type IN ('video_watch', 'video_view') THEN
      UPDATE user_profiles
      SET 
        watch_time = COALESCE(watch_time, 0) + event_duration,
        last_login = NOW()
      WHERE user_id = NEW.user_id;
    ELSIF NEW.event_type IN ('music_listen', 'music_play') THEN
      UPDATE user_profiles
      SET 
        listen_time = COALESCE(listen_time, 0) + event_duration,
        last_login = NOW()
      WHERE user_id = NEW.user_id;
    ELSE
      -- For all other events, just update last_login
      UPDATE user_profiles
      SET last_login = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_update_user_activity ON user_events;

CREATE TRIGGER trigger_auto_update_user_activity
  AFTER INSERT ON user_events
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_user_activity();