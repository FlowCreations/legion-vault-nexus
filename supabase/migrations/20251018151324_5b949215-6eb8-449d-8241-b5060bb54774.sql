-- Add metatags column to videos table
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS metatags TEXT[] DEFAULT ARRAY[]::TEXT[];