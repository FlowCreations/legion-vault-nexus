-- Fix foreign key constraint on email_logs to allow cascading deletes
ALTER TABLE email_logs 
DROP CONSTRAINT IF EXISTS email_logs_user_id_fkey;

-- Recreate the constraint with ON DELETE CASCADE
ALTER TABLE email_logs
ADD CONSTRAINT email_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;