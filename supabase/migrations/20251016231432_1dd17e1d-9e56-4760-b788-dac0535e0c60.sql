-- Add 'hero' to the allowed video categories
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_category_check;

ALTER TABLE videos ADD CONSTRAINT videos_category_check 
CHECK (category IN ('hero', 'music_videos', 'performances', 'behind_the_scenes', 'documentary'));