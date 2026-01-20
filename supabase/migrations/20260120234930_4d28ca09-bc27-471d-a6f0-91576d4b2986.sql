
-- =====================================================
-- SEED DEMO DATA: Legion Speaks, Reactions, Comments, Online Members
-- =====================================================

-- 1. Insert Legion Speaks posts with varied staff personas
INSERT INTO community_posts (user_id, content, category, post_type, view_count, created_at)
SELECT 
  (SELECT user_id FROM user_profiles WHERE user_id IS NOT NULL ORDER BY random() LIMIT 1),
  content_text,
  'legion_speaks',
  'text',
  floor(random() * 300 + 150)::int,
  now() - (interval '1 day' * series_num * 3)
FROM (
  VALUES
    (1, 'Hey Everyone! Now that we''ve had this community running for a few months, I wanted to check in. What''s been your favorite moment so far? Drop it below - I read every single comment. 🔥'),
    (2, 'Tour life update: We''re in Kansas City right now. The crew just finished soundcheck and I''m sitting backstage writing this. There''s something magical about the calm before the storm. Tonight is going to be INSANE.'),
    (3, 'Real talk: Building this community has been one of the most rewarding things I''ve ever done. Seeing you all connect, share your stories, and support each other... that''s what this is all about. Thank you for being here.'),
    (4, 'Studio session went until 4am last night. Can''t share details yet but... just know something special is coming. The Legion will be the FIRST to hear it. 👀'),
    (5, 'Quick question for the fam: What topics do you want me to cover in the next livestream? Drop your suggestions and I''ll pick the top ones. No topic is off limits.'),
    (6, 'Throwback to when this community had just 100 members. Now look at us. Every single one of you matters. Never forget that. LEGION STRONG 💪'),
    (7, 'New merch drop coming this weekend. Designed a few pieces myself this time. Can''t wait to see you all rocking them at the shows.'),
    (8, 'Mental health check: How are you REALLY doing today? This is a safe space. Share what''s on your mind. We''re all in this together.')
) AS data(series_num, content_text);

-- 2. Add reactions to ALL community posts (both announcements and legion speaks)
INSERT INTO post_reactions (post_id, user_id, reaction_type, created_at)
SELECT 
  cp.id,
  up.user_id,
  (ARRAY['like', 'heart', 'fire', 'skull', 'celebrate'])[floor(random() * 5 + 1)::int],
  cp.created_at + (interval '1 minute' * floor(random() * 1440))
FROM community_posts cp
CROSS JOIN (
  SELECT user_id FROM user_profiles 
  WHERE user_id IS NOT NULL 
  ORDER BY random() 
  LIMIT 20
) up
WHERE random() < 0.6
ON CONFLICT DO NOTHING;

-- 3. Add comments to posts
INSERT INTO post_comments (post_id, user_id, content, created_at)
SELECT 
  cp.id,
  (SELECT user_id FROM user_profiles WHERE user_id IS NOT NULL ORDER BY random() LIMIT 1),
  (ARRAY[
    'This is exactly what I needed to hear today 🙏',
    'LEGION STRONG 💪',
    'So hyped for this!!',
    'Been waiting for this update! Thank you!',
    'This community is everything ❤️',
    'Cannot wait to see what''s next!',
    'Best community on the internet fr fr',
    'You always come through for us 🔥',
    'This hits different',
    'Needed this energy today'
  ])[floor(random() * 10 + 1)::int],
  cp.created_at + (interval '1 minute' * floor(random() * 2880))
FROM community_posts cp
CROSS JOIN generate_series(1, 4) AS gs
WHERE random() < 0.7
ON CONFLICT DO NOTHING;

-- 4. Update view counts for posts with 0 views
UPDATE community_posts 
SET view_count = floor(random() * 500 + 150)::int 
WHERE view_count = 0 OR view_count IS NULL;

-- 5. Reset all members to offline first
UPDATE user_profiles SET is_online = false WHERE is_online = true;

-- 6. Set 10 random members as online with recent timestamps
UPDATE user_profiles 
SET 
  is_online = true, 
  last_active_at = now() - (interval '1 minute' * floor(random() * 3))
WHERE id IN (
  SELECT id FROM user_profiles 
  WHERE avatar_url IS NOT NULL 
    AND display_name IS NOT NULL
    AND display_name != ''
  ORDER BY random() 
  LIMIT 10
);
