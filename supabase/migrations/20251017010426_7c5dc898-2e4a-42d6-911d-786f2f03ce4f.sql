-- Create products table for custom merchandise
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'apparel',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create product variants table (sizes, colors, etc)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier DECIMAL(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  custom_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Products are viewable by everyone
CREATE POLICY "Products are viewable by everyone" 
ON public.products FOR SELECT 
USING (true);

-- Product variants are viewable by everyone
CREATE POLICY "Product variants are viewable by everyone" 
ON public.product_variants FOR SELECT 
USING (true);

-- Users can view their own orders
CREATE POLICY "Users can view their own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can create orders
CREATE POLICY "Users can create orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- Users can view order items for their orders
CREATE POLICY "Users can view order items" 
ON public.order_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
);

-- Users can create order items
CREATE POLICY "Users can create order items" 
ON public.order_items FOR INSERT 
WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample products
INSERT INTO public.products (title, description, base_price, category) VALUES
('Custom T-Shirt', 'Premium cotton t-shirt with your choice of gallery image', 29.99, 'apparel'),
('Custom Hoodie', 'Cozy hoodie featuring gallery artwork', 49.99, 'apparel'),
('Custom Poster', 'High-quality print of gallery image', 24.99, 'prints'),
('Custom Mug', 'Ceramic mug with gallery artwork', 14.99, 'accessories');

-- Insert variants for t-shirts
INSERT INTO public.product_variants (product_id, name, price_modifier, stock)
SELECT id, 'Small', 0, 100 FROM public.products WHERE title = 'Custom T-Shirt'
UNION ALL
SELECT id, 'Medium', 0, 100 FROM public.products WHERE title = 'Custom T-Shirt'
UNION ALL
SELECT id, 'Large', 0, 100 FROM public.products WHERE title = 'Custom T-Shirt'
UNION ALL
SELECT id, 'X-Large', 2.00, 100 FROM public.products WHERE title = 'Custom T-Shirt';

-- Insert variants for hoodies
INSERT INTO public.product_variants (product_id, name, price_modifier, stock)
SELECT id, 'Small', 0, 50 FROM public.products WHERE title = 'Custom Hoodie'
UNION ALL
SELECT id, 'Medium', 0, 50 FROM public.products WHERE title = 'Custom Hoodie'
UNION ALL
SELECT id, 'Large', 0, 50 FROM public.products WHERE title = 'Custom Hoodie'
UNION ALL
SELECT id, 'X-Large', 3.00, 50 FROM public.products WHERE title = 'Custom Hoodie';