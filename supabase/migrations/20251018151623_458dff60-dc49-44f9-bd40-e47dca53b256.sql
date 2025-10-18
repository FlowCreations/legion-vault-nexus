-- Rename subtitle column to description in videos table
ALTER TABLE public.videos 
RENAME COLUMN subtitle TO description;