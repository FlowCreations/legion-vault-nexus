-- Add heartbeat_thread_id column to track synced announcements
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS heartbeat_thread_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_community_posts_heartbeat_thread_id 
ON community_posts(heartbeat_thread_id) 
WHERE heartbeat_thread_id IS NOT NULL;