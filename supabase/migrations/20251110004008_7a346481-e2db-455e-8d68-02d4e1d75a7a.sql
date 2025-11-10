-- Drop the old trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created_send_signup_email ON auth.users;
DROP FUNCTION IF EXISTS public.send_email_on_signup();

-- Create function to send signup email when profile is created
CREATE OR REPLACE FUNCTION public.send_signup_email_on_profile_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  first_name TEXT;
  supabase_url TEXT;
  anon_key TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- Get first name from profile or derive from email
  first_name := COALESCE(NEW.first_name, split_part(user_email, '@', 1));
  
  -- Get Supabase configuration
  supabase_url := COALESCE(
    current_setting('app.settings', true)::json->>'supabase_url',
    'https://dlwyndcvnunvomgkbkhn.supabase.co'
  );
  
  anon_key := COALESCE(
    current_setting('app.settings', true)::json->>'anon_key',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsd3luZGN2bnVudm9tZ2tia2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDgxOTEsImV4cCI6MjA3NjEyNDE5MX0.S1UQQsb3hDT7re82UX8LLLxCwf9DDu7IfZqsWyqdacg'
  );
  
  -- Call signup email function asynchronously
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-signup-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id::text,
      'email', user_email,
      'firstName', first_name
    )
  );
  
  -- Log the email send attempt
  INSERT INTO public.email_logs (user_id, email_type, recipient_email, status)
  VALUES (NEW.user_id, 'signup', user_email, 'sent')
  ON CONFLICT (user_id, email_type) DO UPDATE SET status = 'sent', sent_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the profile creation
    INSERT INTO public.email_logs (user_id, email_type, recipient_email, status, error_message)
    VALUES (NEW.user_id, 'signup', user_email, 'failed', SQLERRM)
    ON CONFLICT (user_id, email_type) DO UPDATE SET status = 'failed', error_message = SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on user_profiles table
CREATE TRIGGER on_profile_created_send_signup_email
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_signup_email_on_profile_creation();