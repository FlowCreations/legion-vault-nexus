-- Enable real-time updates for livestream_reactions table
-- This allows the LiveReactionAnalytics component to receive instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.livestream_reactions;