-- Add Ticketmaster venue columns to tour_shows table
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS ticketmaster_venue_id TEXT;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS venue_image_url TEXT;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS venue_address TEXT;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS venue_lat DOUBLE PRECISION;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS venue_lng DOUBLE PRECISION;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS venue_seatmap_url TEXT;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS venue_url TEXT;
ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS venue_info JSONB;