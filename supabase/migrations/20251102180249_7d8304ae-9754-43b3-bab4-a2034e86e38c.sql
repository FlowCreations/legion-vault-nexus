-- Create user_milestones table to track achievements
CREATE TABLE IF NOT EXISTS public.user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('silver_star', 'gold_star', 'dunbar_champion')),
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_minutes_at_achievement INTEGER NOT NULL,
  reward_claimed BOOLEAN DEFAULT false,
  reward_claimed_at TIMESTAMP WITH TIME ZONE,
  shipping_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create milestone_progress table to cache current state
CREATE TABLE IF NOT EXISTS public.milestone_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_minutes INTEGER DEFAULT 0,
  current_badge TEXT CHECK (current_badge IN ('silver_star', 'gold_star', 'medallion')),
  next_milestone_minutes INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_milestones
CREATE POLICY "Users can view their own milestones"
  ON public.user_milestones
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all milestones"
  ON public.user_milestones
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert milestones"
  ON public.user_milestones
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own milestone rewards"
  ON public.user_milestones
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for milestone_progress
CREATE POLICY "Users can view their own progress"
  ON public.milestone_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
  ON public.milestone_progress
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage progress"
  ON public.milestone_progress
  FOR ALL
  USING (true);

-- Function to compute total minutes and update milestone_progress
CREATE OR REPLACE FUNCTION public.compute_total_minutes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update or insert milestone_progress
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
$$ LANGUAGE plpgsql;

-- Function to check and award milestones
CREATE OR REPLACE FUNCTION public.check_and_award_milestones()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  silver_threshold INTEGER := 210;    -- 3.5 hours
  gold_threshold INTEGER := 300;      -- 5 hours
  champion_threshold INTEGER := 420;  -- 7 hours
  milestone_awarded BOOLEAN := false;
BEGIN
  -- Check Silver Star (210 minutes)
  IF NEW.total_minutes >= silver_threshold 
     AND NOT EXISTS (
       SELECT 1 FROM public.user_milestones 
       WHERE user_id = NEW.user_id 
       AND milestone_type = 'silver_star'
     ) THEN
    INSERT INTO public.user_milestones (user_id, milestone_type, total_minutes_at_achievement)
    VALUES (NEW.user_id, 'silver_star', NEW.total_minutes);
    
    UPDATE public.milestone_progress 
    SET current_badge = 'silver_star', 
        next_milestone_minutes = gold_threshold
    WHERE user_id = NEW.user_id;
    
    milestone_awarded := true;
  END IF;

  -- Check Gold Star (300 minutes)
  IF NEW.total_minutes >= gold_threshold 
     AND NOT EXISTS (
       SELECT 1 FROM public.user_milestones 
       WHERE user_id = NEW.user_id 
       AND milestone_type = 'gold_star'
     ) THEN
    INSERT INTO public.user_milestones (user_id, milestone_type, total_minutes_at_achievement)
    VALUES (NEW.user_id, 'gold_star', NEW.total_minutes);
    
    UPDATE public.milestone_progress 
    SET current_badge = 'gold_star', 
        next_milestone_minutes = champion_threshold
    WHERE user_id = NEW.user_id;
    
    milestone_awarded := true;
  END IF;

  -- Check Dunbar Champion (420 minutes)
  IF NEW.total_minutes >= champion_threshold 
     AND NOT EXISTS (
       SELECT 1 FROM public.user_milestones 
       WHERE user_id = NEW.user_id 
       AND milestone_type = 'dunbar_champion'
     ) THEN
    INSERT INTO public.user_milestones (user_id, milestone_type, total_minutes_at_achievement)
    VALUES (NEW.user_id, 'dunbar_champion', NEW.total_minutes);
    
    UPDATE public.milestone_progress 
    SET current_badge = 'medallion', 
        next_milestone_minutes = NULL
    WHERE user_id = NEW.user_id;
    
    milestone_awarded := true;
  END IF;

  -- Set initial next_milestone if none set yet
  IF NEW.next_milestone_minutes IS NULL AND NEW.current_badge IS NULL THEN
    UPDATE public.milestone_progress 
    SET next_milestone_minutes = silver_threshold
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on user_profiles to compute total minutes
CREATE TRIGGER trigger_compute_total_minutes
  AFTER UPDATE OF watch_time, listen_time ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_total_minutes();

-- Trigger on milestone_progress to check and award milestones
CREATE TRIGGER trigger_check_milestones
  AFTER INSERT OR UPDATE OF total_minutes ON public.milestone_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_award_milestones();

-- Create indexes for performance
CREATE INDEX idx_user_milestones_user_id ON public.user_milestones(user_id);
CREATE INDEX idx_user_milestones_type ON public.user_milestones(milestone_type);
CREATE INDEX idx_milestone_progress_badge ON public.milestone_progress(current_badge);

-- Enable realtime for milestone achievements
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_milestones;