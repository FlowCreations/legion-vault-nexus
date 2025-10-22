
-- Add status column to affiliates table to track activation
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS status text DEFAULT 'inactive' CHECK (status IN ('active', 'inactive'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);
