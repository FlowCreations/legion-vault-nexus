
CREATE OR REPLACE FUNCTION public.compute_total_minutes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

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
$function$;
