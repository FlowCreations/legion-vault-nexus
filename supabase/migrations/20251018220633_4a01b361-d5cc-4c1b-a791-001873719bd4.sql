-- Allow anonymous posting for demo purposes
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;

CREATE POLICY "Anyone can create posts"
  ON public.community_posts
  FOR INSERT
  WITH CHECK (true);

-- Make user_id nullable temporarily for demo
ALTER TABLE public.community_posts ALTER COLUMN user_id DROP NOT NULL;