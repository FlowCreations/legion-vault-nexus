-- Add more creative products for Sons of Legion
INSERT INTO public.products (title, description, base_price, category) VALUES
('Custom Tank Top', 'Lightweight tank with bold gallery graphics', 24.99, 'apparel'),
('Custom Crew Sweatshirt', 'Heavy-weight crewneck sweatshirt with gallery art', 44.99, 'apparel'),
('Custom Zip Hoodie', 'Full-zip hoodie featuring your favorite gallery image', 54.99, 'apparel'),
('Custom Bandana', 'Premium bandana with gallery artwork', 12.99, 'accessories'),
('Custom Snapback Hat', 'Embroidered snapback with gallery design', 29.99, 'accessories'),
('Custom Beanie', 'Cozy beanie with embroidered gallery art', 19.99, 'accessories'),
('Custom Tote Bag', 'Heavy-duty canvas tote with gallery print', 22.99, 'accessories'),
('Custom Backpack', 'All-over print backpack with gallery imagery', 59.99, 'accessories'),
('Custom Phone Case', 'Durable case with gallery artwork', 17.99, 'accessories'),
('Custom Laptop Sleeve', 'Padded sleeve featuring gallery print', 24.99, 'accessories'),
('Canvas Gallery Print', 'Museum-quality canvas print', 49.99, 'prints'),
('Metal Print', 'Vibrant metal print of gallery image', 89.99, 'prints'),
('Framed Print', 'Premium framed gallery print', 69.99, 'prints'),
('Print Set (3-Pack)', 'Three coordinating gallery prints', 59.99, 'prints'),
('Custom Vinyl Sticker', 'Weather-resistant vinyl sticker', 4.99, 'accessories'),
('Sticker Pack (5)', 'Five assorted gallery stickers', 14.99, 'accessories'),
('Custom Throw Pillow', 'Soft throw pillow with gallery art', 29.99, 'home'),
('Custom Blanket', 'Cozy fleece blanket with gallery print', 44.99, 'home'),
('Custom Tapestry', 'Large wall tapestry featuring gallery image', 39.99, 'home'),
('Enamel Pin', 'Die-cast enamel pin with gallery design', 9.99, 'accessories'),
('Custom Keychain', 'Acrylic keychain with gallery artwork', 7.99, 'accessories'),
('Custom Notebook', 'Hardcover notebook with gallery cover', 16.99, 'accessories'),
('Custom Journal', 'Premium leather journal with gallery art', 34.99, 'accessories'),
('Custom Coasters (4-Pack)', 'Cork-backed coasters with gallery prints', 18.99, 'home');

-- Add variants for tank tops
INSERT INTO public.product_variants (product_id, name, price_modifier, stock)
SELECT id, 'Small', 0, 100 FROM public.products WHERE title = 'Custom Tank Top'
UNION ALL
SELECT id, 'Medium', 0, 100 FROM public.products WHERE title = 'Custom Tank Top'
UNION ALL
SELECT id, 'Large', 0, 100 FROM public.products WHERE title = 'Custom Tank Top'
UNION ALL
SELECT id, 'X-Large', 2.00, 100 FROM public.products WHERE title = 'Custom Tank Top';

-- Add variants for crew sweatshirt
INSERT INTO public.product_variants (product_id, name, price_modifier, stock)
SELECT id, 'Small', 0, 80 FROM public.products WHERE title = 'Custom Crew Sweatshirt'
UNION ALL
SELECT id, 'Medium', 0, 80 FROM public.products WHERE title = 'Custom Crew Sweatshirt'
UNION ALL
SELECT id, 'Large', 0, 80 FROM public.products WHERE title = 'Custom Crew Sweatshirt'
UNION ALL
SELECT id, 'X-Large', 3.00, 80 FROM public.products WHERE title = 'Custom Crew Sweatshirt'
UNION ALL
SELECT id, '2X-Large', 5.00, 60 FROM public.products WHERE title = 'Custom Crew Sweatshirt';

-- Add variants for zip hoodie
INSERT INTO public.product_variants (product_id, name, price_modifier, stock)
SELECT id, 'Small', 0, 60 FROM public.products WHERE title = 'Custom Zip Hoodie'
UNION ALL
SELECT id, 'Medium', 0, 60 FROM public.products WHERE title = 'Custom Zip Hoodie'
UNION ALL
SELECT id, 'Large', 0, 60 FROM public.products WHERE title = 'Custom Zip Hoodie'
UNION ALL
SELECT id, 'X-Large', 3.00, 60 FROM public.products WHERE title = 'Custom Zip Hoodie'
UNION ALL
SELECT id, '2X-Large', 5.00, 40 FROM public.products WHERE title = 'Custom Zip Hoodie';

-- Add variants for canvas prints
INSERT INTO public.product_variants (product_id, name, price_modifier, stock)
SELECT id, '12x16"', 0, 50 FROM public.products WHERE title = 'Canvas Gallery Print'
UNION ALL
SELECT id, '16x20"', 15.00, 50 FROM public.products WHERE title = 'Canvas Gallery Print'
UNION ALL
SELECT id, '24x36"', 30.00, 40 FROM public.products WHERE title = 'Canvas Gallery Print'
UNION ALL
SELECT id, '30x40"', 50.00, 30 FROM public.products WHERE title = 'Canvas Gallery Print';

-- Add variants for metal prints
INSERT INTO public.product_variants (product_id, name, price_modifier, stock)
SELECT id, '12x16"', 0, 40 FROM public.products WHERE title = 'Metal Print'
UNION ALL
SELECT id, '16x20"', 20.00, 40 FROM public.products WHERE title = 'Metal Print'
UNION ALL
SELECT id, '24x36"', 50.00, 30 FROM public.products WHERE title = 'Metal Print';

-- Add variants for framed prints
INSERT INTO public.product_variants (product_id, name, price_modifier, stock)
SELECT id, '12x16" Black', 0, 50 FROM public.products WHERE title = 'Framed Print'
UNION ALL
SELECT id, '12x16" White', 0, 50 FROM public.products WHERE title = 'Framed Print'
UNION ALL
SELECT id, '16x20" Black', 15.00, 40 FROM public.products WHERE title = 'Framed Print'
UNION ALL
SELECT id, '16x20" White', 15.00, 40 FROM public.products WHERE title = 'Framed Print'
UNION ALL
SELECT id, '24x36" Black', 35.00, 30 FROM public.products WHERE title = 'Framed Print'
UNION ALL
SELECT id, '24x36" White', 35.00, 30 FROM public.products WHERE title = 'Framed Print';

-- Add variants for blankets
INSERT INTO public.product_variants (product_id, name, price_modifier, stock)
SELECT id, '50x60"', 0, 50 FROM public.products WHERE title = 'Custom Blanket'
UNION ALL
SELECT id, '60x80"', 15.00, 40 FROM public.products WHERE title = 'Custom Blanket';

-- Add variants for tapestry
INSERT INTO public.product_variants (product_id, name, price_modifier, stock)
SELECT id, '40x60"', 0, 60 FROM public.products WHERE title = 'Custom Tapestry'
UNION ALL
SELECT id, '60x80"', 20.00, 50 FROM public.products WHERE title = 'Custom Tapestry';

-- Update categories in the main table if needed
UPDATE public.products SET category = 'home' WHERE title IN ('Custom Throw Pillow', 'Custom Blanket', 'Custom Tapestry', 'Custom Coasters (4-Pack)');