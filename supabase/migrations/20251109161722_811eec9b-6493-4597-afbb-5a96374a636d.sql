-- Step 1: Enable required extensions for email automation
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Create email_logs table for monitoring
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Merchants can view all email logs
CREATE POLICY "Merchants can view email logs"
ON public.email_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('merchant', 'admin')
  )
);

-- Service role can manage email logs
CREATE POLICY "Service role can manage email logs"
ON public.email_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Step 3: Update handle_new_user_signup trigger to send welcome email
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_email TEXT;
  first_name TEXT;
  supabase_url TEXT;
  anon_key TEXT;
BEGIN
  -- Get user email
  user_email := NEW.email;
  
  -- Extract first name from email (before @) as fallback
  first_name := split_part(user_email, '@', 1);
  
  -- Get Supabase URL and anon key from environment
  supabase_url := current_setting('app.settings', true)::json->>'supabase_url';
  anon_key := current_setting('app.settings', true)::json->>'anon_key';
  
  -- If settings not found, use default values
  IF supabase_url IS NULL THEN
    supabase_url := 'https://dlwyndcvnunvomgkbkhn.supabase.co';
  END IF;
  
  IF anon_key IS NULL THEN
    anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsd3luZGN2bnVudm9tZ2tia2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDgxOTEsImV4cCI6MjA3NjEyNDE5MX0.S1UQQsb3hDT7re82UX8LLLxCwf9DDu7IfZqsWyqdacg';
  END IF;
  
  -- Call welcome email function asynchronously
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'userId', NEW.id::text,
      'email', user_email,
      'firstName', first_name
    )
  );
  
  -- Log the email send attempt
  INSERT INTO public.email_logs (user_id, email_type, recipient_email, status)
  VALUES (NEW.id, 'welcome', user_email, 'pending');
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    INSERT INTO public.email_logs (user_id, email_type, recipient_email, status, error_message)
    VALUES (NEW.id, 'welcome', user_email, 'failed', SQLERRM);
    RETURN NEW;
END;
$$;

-- Recreate trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- Step 4: Set up cron job to process scheduled emails every hour
SELECT cron.schedule(
  'process-scheduled-emails-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://dlwyndcvnunvomgkbkhn.supabase.co/functions/v1/process-scheduled-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsd3luZGN2bnVudm9tZ2tia2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDgxOTEsImV4cCI6MjA3NjEyNDE5MX0.S1UQQsb3hDT7re82UX8LLLxCwf9DDu7IfZqsWyqdacg'
    )
  ) as request_id;
  $$
);