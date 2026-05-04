
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS purchase_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS favorite_count integer NOT NULL DEFAULT 0;
