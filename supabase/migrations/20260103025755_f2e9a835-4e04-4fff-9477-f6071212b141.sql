-- Enable full replica identity for proper realtime updates
ALTER TABLE public.livestream_events REPLICA IDENTITY FULL;

-- Add livestream_events to the realtime publication for instant sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.livestream_events;