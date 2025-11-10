-- Create trigger function to send branded signup email
CREATE OR REPLACE FUNCTION public.send_email_on_signup()
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
  user_email := NEW.email;
  first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(user_email, '@', 1));
  
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
      'userId', NEW.id::text,
      'email', user_email,
      'firstName', first_name
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    INSERT INTO public.email_logs (user_id, email_type, recipient_email, status, error_message)
    VALUES (NEW.id, 'signup', NEW.email, 'failed', SQLERRM)
    ON CONFLICT (user_id, email_type) DO UPDATE SET status = 'failed', error_message = SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users for new signups
DROP TRIGGER IF EXISTS on_auth_user_created_send_signup_email ON auth.users;
CREATE TRIGGER on_auth_user_created_send_signup_email
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.send_email_on_signup();