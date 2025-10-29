-- Add user_id column to email_lists table
ALTER TABLE public.email_lists 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set existing rows to have a user_id (if any exist)
-- This will need to be updated manually if there are existing rows

-- Create index for better performance
CREATE INDEX idx_email_lists_user_id ON public.email_lists(user_id);

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own email lists" ON public.email_lists;
DROP POLICY IF EXISTS "Users can create their own email lists" ON public.email_lists;
DROP POLICY IF EXISTS "Users can update their own email lists" ON public.email_lists;
DROP POLICY IF EXISTS "Users can delete their own email lists" ON public.email_lists;

-- Enable RLS
ALTER TABLE public.email_lists ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_lists
CREATE POLICY "Users can view their own email lists"
  ON public.email_lists
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own email lists"
  ON public.email_lists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email lists"
  ON public.email_lists
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email lists"
  ON public.email_lists
  FOR DELETE
  USING (auth.uid() = user_id);