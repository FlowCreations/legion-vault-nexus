-- Step 1: Delete older duplicates, keep newest
WITH ranked_lists AS (
  SELECT id, name, user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id, name ORDER BY created_at DESC) as rn
  FROM email_lists
)
DELETE FROM email_lists
WHERE id IN (
  SELECT id FROM ranked_lists WHERE rn > 1
);

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE email_lists 
ADD CONSTRAINT email_lists_user_name_unique 
UNIQUE (user_id, name);