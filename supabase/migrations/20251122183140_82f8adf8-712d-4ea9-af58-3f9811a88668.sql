-- Fix foreign key blocking user deletion
-- Point purchases.user_id to public.user_profiles instead of auth.users

ALTER TABLE public.purchases
  DROP CONSTRAINT IF EXISTS purchases_user_id_fkey;

ALTER TABLE public.purchases
  ADD CONSTRAINT purchases_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.user_profiles(user_id)
  ON DELETE SET NULL;