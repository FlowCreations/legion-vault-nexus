
-- Add more likes and hearts to all posts (15-40 per post)
INSERT INTO post_reactions (post_id, user_id, reaction_type, created_at)
SELECT 
  cp.id,
  up.user_id,
  reaction_types.rtype,
  now() - (interval '1 hour' * floor(random() * 200))
FROM community_posts cp
CROSS JOIN (
  SELECT user_id FROM user_profiles 
  WHERE user_id IS NOT NULL 
  ORDER BY random() 
  LIMIT 45
) up
CROSS JOIN (VALUES ('like'), ('heart')) AS reaction_types(rtype)
WHERE random() < 0.45
ON CONFLICT DO NOTHING;

-- Add more comments (15-35 per post with varied templates)
INSERT INTO post_comments (post_id, user_id, content, created_at)
SELECT 
  cp.id,
  (SELECT user_id FROM user_profiles WHERE user_id IS NOT NULL ORDER BY random() LIMIT 1),
  (ARRAY[
    'This is exactly what I needed to hear today 🙌',
    'LEGION STRONG 🖤',
    'So hyped for this!!',
    'Been waiting for this! Thank you! 🔥',
    'This community is everything 💀',
    'Can''t wait! Already got my tickets!',
    'Y''all are the best. Seriously.',
    'The boys never disappoint 🤘',
    'Crying rn 😭❤️',
    'SEE YOU THERE!!!',
    'This made my whole week',
    'Absolute legends',
    'Best decision ever joining this community',
    'THIS IS AMAZING',
    'Take my money!! 💸',
    'LFG!! 🔥🔥🔥',
    'You guys are insane',
    'Goosebumps reading this',
    'Needed this energy today',
    'ICONIC',
    'Forever grateful for this community ❤️',
    'Just when I thought you couldn''t top yourselves',
    'My heart 😭',
    'COUNT ME IN',
    'This is why we ride with y''all'
  ])[floor(random() * 25 + 1)::int],
  cp.created_at + (interval '1 minute' * floor(random() * 2880))
FROM community_posts cp
CROSS JOIN generate_series(1, 28)
WHERE random() < 0.85
ON CONFLICT DO NOTHING;
