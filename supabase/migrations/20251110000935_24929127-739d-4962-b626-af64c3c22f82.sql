-- Add unique constraint to email_logs table to fix verification error
ALTER TABLE public.email_logs 
ADD CONSTRAINT email_logs_user_id_email_type_key UNIQUE (user_id, email_type);