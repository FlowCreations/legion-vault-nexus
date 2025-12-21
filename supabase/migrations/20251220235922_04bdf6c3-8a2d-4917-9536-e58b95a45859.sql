-- Create ticket types table
CREATE TABLE public.ticket_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID REFERENCES public.tour_shows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  available_quantity INTEGER DEFAULT 0,
  max_per_order INTEGER DEFAULT 8,
  tier_order INTEGER DEFAULT 1,
  perks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create venue sections table
CREATE TABLE public.venue_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID REFERENCES public.tour_shows(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  section_type TEXT DEFAULT 'general',
  capacity INTEGER DEFAULT 0,
  available INTEGER DEFAULT 0,
  price_modifier NUMERIC DEFAULT 1.0,
  row_start INTEGER,
  row_end INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ticket merch bundles table
CREATE TABLE public.ticket_merch_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  bundle_price NUMERIC NOT NULL,
  original_price NUMERIC NOT NULL,
  savings_percentage INTEGER,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url TEXT,
  available_sizes JSONB DEFAULT '["S", "M", "L", "XL", "2XL"]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ticket orders table
CREATE TABLE public.ticket_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  show_id UUID REFERENCES public.tour_shows(id),
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  tickets JSONB NOT NULL DEFAULT '[]'::jsonb,
  bundles JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  ticketmaster_fees NUMERIC DEFAULT 0,
  portal_convenience_fee NUMERIC DEFAULT 2.50,
  total NUMERIC NOT NULL DEFAULT 0,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  payment_intent_id TEXT,
  stripe_session_id TEXT,
  confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_merch_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for ticket_types (public read)
CREATE POLICY "Anyone can view ticket types" ON public.ticket_types
  FOR SELECT USING (true);

CREATE POLICY "Merchants can manage ticket types" ON public.ticket_types
  FOR ALL USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for venue_sections (public read)
CREATE POLICY "Anyone can view venue sections" ON public.venue_sections
  FOR SELECT USING (true);

CREATE POLICY "Merchants can manage venue sections" ON public.venue_sections
  FOR ALL USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for ticket_merch_bundles (public read)
CREATE POLICY "Anyone can view ticket bundles" ON public.ticket_merch_bundles
  FOR SELECT USING (true);

CREATE POLICY "Merchants can manage ticket bundles" ON public.ticket_merch_bundles
  FOR ALL USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for ticket_orders
CREATE POLICY "Users can view their own orders" ON public.ticket_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.ticket_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all orders" ON public.ticket_orders
  FOR ALL USING (true);

CREATE POLICY "Merchants can view all orders" ON public.ticket_orders
  FOR SELECT USING (has_role(auth.uid(), 'merchant'::app_role) OR has_role(auth.uid(), 'admin'::app_role));