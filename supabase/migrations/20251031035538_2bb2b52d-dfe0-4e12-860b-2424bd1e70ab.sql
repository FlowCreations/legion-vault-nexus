-- Add foreign key relationship to videos table
ALTER TABLE video_favorites
ADD CONSTRAINT fk_video_favorites_video
FOREIGN KEY (video_id) 
REFERENCES videos(id) 
ON DELETE CASCADE;