-- Add last_heartbeat column to livestream_events
ALTER TABLE public.livestream_events 
ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP WITH TIME ZONE;

-- Update existing live events to have a heartbeat (or mark stale ones as ended)
UPDATE public.livestream_events 
SET status = 'ended', updated_at = NOW()
WHERE status = 'live' 
AND (last_heartbeat IS NULL OR last_heartbeat < NOW() - INTERVAL '2 minutes');

-- Create index for efficient heartbeat queries
CREATE INDEX IF NOT EXISTS idx_livestream_events_heartbeat 
ON public.livestream_events (status, last_heartbeat) 
WHERE status = 'live';