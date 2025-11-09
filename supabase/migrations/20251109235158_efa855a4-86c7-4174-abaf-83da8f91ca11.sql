-- Drop the existing triggers and functions with CASCADE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_signup() CASCADE;

-- Create a new function that sends welcome email only after email verification
CREATE OR REPLACE FUNCTION public.send_welcome_after_verification()
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
  welcome_sent BOOLEAN;
BEGIN
  -- Only proceed if email was just confirmed (changed from NULL to a timestamp)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    user_email := NEW.email;
    first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(user_email, '@', 1));
    
    -- Check if welcome email already sent
    SELECT EXISTS (
      SELECT 1 FROM public.email_logs 
      WHERE user_id = NEW.id 
      AND email_type = 'welcome' 
      AND status = 'sent'
    ) INTO welcome_sent;
    
    -- Only send if not already sent
    IF NOT welcome_sent THEN
      supabase_url := COALESCE(
        current_setting('app.settings', true)::json->>'supabase_url',
        'https://dlwyndcvnunvomgkbkhn.supabase.co'
      );
      
      anon_key := COALESCE(
        current_setting('app.settings', true)::json->>'anon_key',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsd3luZGN2bnVudm9tZ2tia2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDgxOTEsImV4cCI6MjA3NjEyNDE5MX0.S1UQQsb3hDT7re82UX8LLLxCwf9DDu7IfZqsWyqdacg'
      );
      
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
      VALUES (NEW.id, 'welcome', user_email, 'sent')
      ON CONFLICT (user_id, email_type) DO UPDATE SET status = 'sent', sent_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the update
    INSERT INTO public.email_logs (user_id, email_type, recipient_email, status, error_message)
    VALUES (NEW.id, 'welcome', NEW.email, 'failed', SQLERRM)
    ON CONFLICT (user_id, email_type) DO UPDATE SET status = 'failed', error_message = SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users for email confirmation
CREATE TRIGGER on_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.send_welcome_after_verification();