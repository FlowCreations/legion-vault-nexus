-- Create fan_journey_milestones table to track specific journey stages
CREATE TABLE public.fan_journey_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  milestone_key TEXT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_key)
);

-- Create index for fast user lookups
CREATE INDEX idx_fan_journey_milestones_user_id ON public.fan_journey_milestones(user_id);
CREATE INDEX idx_fan_journey_milestones_milestone_key ON public.fan_journey_milestones(milestone_key);
CREATE INDEX idx_fan_journey_milestones_achieved_at ON public.fan_journey_milestones(achieved_at DESC);

-- Enable RLS
ALTER TABLE public.fan_journey_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own milestones"
ON public.fan_journey_milestones
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Merchants can view all milestones"
ON public.fan_journey_milestones
FOR SELECT
USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert milestones"
ON public.fan_journey_milestones
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update milestones"
ON public.fan_journey_milestones
FOR UPDATE
USING (true);

-- Create function to record milestone achievement (upsert)
CREATE OR REPLACE FUNCTION public.record_journey_milestone(
  p_user_id UUID,
  p_milestone_key TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.fan_journey_milestones (user_id, milestone_key, metadata)
  VALUES (p_user_id, p_milestone_key, p_metadata)
  ON CONFLICT (user_id, milestone_key) DO NOTHING;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable realtime for milestones
ALTER PUBLICATION supabase_realtime ADD TABLE public.fan_journey_milestones;