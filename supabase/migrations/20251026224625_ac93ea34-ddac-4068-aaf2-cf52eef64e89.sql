-- Delete the duplicate pixel configuration record
DELETE FROM social_credentials 
WHERE id = '6f07db58-21bc-4b07-ae1e-5b3c7d3df75c';

-- Add unique constraint to prevent future duplicate pixel configurations
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_pixel_per_platform
ON social_credentials (platform, credential_type, user_id)
WHERE is_configured = true AND credential_type = 'pixel_id';