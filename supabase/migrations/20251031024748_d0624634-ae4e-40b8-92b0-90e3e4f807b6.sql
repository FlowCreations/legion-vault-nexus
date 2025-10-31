-- Add display_order column to music_tracks table for custom ordering
ALTER TABLE music_tracks 
ADD COLUMN display_order integer;

-- Set initial display order based on current order (by created_at)
UPDATE music_tracks 
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM music_tracks
) AS subquery
WHERE music_tracks.id = subquery.id;