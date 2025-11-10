-- Add livestream engagement tracking to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS livestream_reaction_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS livestream_hearts_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS livestream_claps_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS livestream_engagement_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_super_fan BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_livestream_reaction TIMESTAMP WITH TIME ZONE;

-- Create index for super fan queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_super_fan ON public.user_profiles(is_super_fan) WHERE is_super_fan = true;
CREATE INDEX IF NOT EXISTS idx_user_profiles_engagement_score ON public.user_profiles(livestream_engagement_score DESC);

-- Function to update user livestream engagement
CREATE OR REPLACE FUNCTION public.update_livestream_engagement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_reactions INTEGER;
  hearts_count INTEGER;
  claps_count INTEGER;
  engagement_score NUMERIC;
  is_superfan BOOLEAN;
BEGIN
  -- Only process if user_id is present
  IF NEW.user_id IS NOT NULL THEN
    -- Count total reactions for this user
    SELECT 
      COUNT(*),
      COUNT(*) FILTER (WHERE reaction_type = 'heart'),
      COUNT(*) FILTER (WHERE reaction_type = 'clap')
    INTO total_reactions, hearts_count, claps_count
    FROM public.livestream_reactions
    WHERE user_id = NEW.user_id;
    
    -- Calculate engagement score (hearts worth 2 points, claps worth 1 point)
    engagement_score := (hearts_count * 2) + (claps_count * 1);
    
    -- Determine if user is a super fan
    -- Super fan criteria: 
    -- - 20+ total reactions OR
    -- - 10+ hearts OR
    -- - Engagement score >= 25
    is_superfan := (
      total_reactions >= 20 OR 
      hearts_count >= 10 OR 
      engagement_score >= 25
    );
    
    -- Update user profile
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

-- Create trigger to automatically update engagement after reactions
DROP TRIGGER IF EXISTS update_user_engagement_on_reaction ON public.livestream_reactions;
CREATE TRIGGER update_user_engagement_on_reaction
  AFTER INSERT ON public.livestream_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_livestream_engagement();

-- Create a function to recalculate all user engagement scores (for manual updates)
CREATE OR REPLACE FUNCTION public.recalculate_all_livestream_engagement()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Loop through all users who have sent reactions
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM public.livestream_reactions 
    WHERE user_id IS NOT NULL
  LOOP
    -- Update each user's profile
    WITH reaction_stats AS (
      SELECT 
        COUNT(*) as total_reactions,
        COUNT(*) FILTER (WHERE reaction_type = 'heart') as hearts_count,
        COUNT(*) FILTER (WHERE reaction_type = 'clap') as claps_count,
        MAX(created_at) as last_reaction
      FROM public.livestream_reactions
      WHERE user_id = user_record.user_id
    )
    UPDATE public.user_profiles
    SET 
      livestream_reaction_count = reaction_stats.total_reactions,
      livestream_hearts_sent = reaction_stats.hearts_count,
      livestream_claps_sent = reaction_stats.claps_count,
      livestream_engagement_score = (reaction_stats.hearts_count * 2) + (reaction_stats.claps_count * 1),
      is_super_fan = (
        reaction_stats.total_reactions >= 20 OR 
        reaction_stats.hearts_count >= 10 OR 
        ((reaction_stats.hearts_count * 2) + (reaction_stats.claps_count * 1)) >= 25
      ),
      last_livestream_reaction = reaction_stats.last_reaction,
      updated_at = NOW()
    FROM reaction_stats
    WHERE user_profiles.user_id = user_record.user_id;
  END LOOP;
END;
$$;