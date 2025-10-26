-- Add tracking mode and metadata columns to social_credentials table
ALTER TABLE social_credentials 
ADD COLUMN IF NOT EXISTS tracking_mode text DEFAULT 'browser_only' CHECK (tracking_mode IN ('browser_only', 'full')),
ADD COLUMN IF NOT EXISTS credential_metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS browser_events_enabled boolean DEFAULT true;

-- Update existing records to have the new fields
UPDATE social_credentials 
SET tracking_mode = 'browser_only',
    browser_events_enabled = true
WHERE tracking_mode IS NULL;