-- Create tour shows table
CREATE TABLE public.tour_shows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT DEFAULT 'USA',
  venue TEXT NOT NULL,
  ticket_link TEXT,
  status TEXT DEFAULT 'on_sale' CHECK (status IN ('on_sale', 'low_tickets', 'sold_out')),
  special_guests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tour_shows ENABLE ROW LEVEL SECURITY;

-- Everyone can view tour shows
CREATE POLICY "Tour shows viewable by everyone"
ON public.tour_shows
FOR SELECT
USING (true);

-- Merchants can manage tour shows
CREATE POLICY "Merchants can manage tour shows"
ON public.tour_shows
FOR ALL
USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_tour_shows_updated_at
BEFORE UPDATE ON public.tour_shows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();