-- Add seating_type column to distinguish between reserved seating and general admission
ALTER TABLE public.tour_shows 
ADD COLUMN IF NOT EXISTS seating_type TEXT DEFAULT 'general_admission' 
CHECK (seating_type IN ('reserved', 'general_admission'));