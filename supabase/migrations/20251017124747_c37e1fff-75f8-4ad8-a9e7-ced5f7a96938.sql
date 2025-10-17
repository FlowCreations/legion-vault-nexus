-- Remove generic placeholder products from apparel category
DELETE FROM products WHERE id IN (
  'c5ad85b8-a6d6-4d0f-82b1-380d0dd204bf', -- Crew Sweatshirt
  '9e056d77-44a8-41e5-8c1b-8a185c456d3f', -- Hoodie
  '02aa5d62-81c6-440a-a7c4-86909aad53be', -- T-Shirt
  '0ebfecbb-3053-4c53-955c-0bb365b4ca86', -- Tank Top
  'c5b0083e-775e-4138-96e4-8ebcd0c67734'  -- Zip Hoodie
);

-- Remove all generic placeholder products from home category
DELETE FROM products WHERE category = 'home';

-- Remove generic placeholder products from prints category (keep SOL TO SOUL Tour Poster)
DELETE FROM products WHERE category = 'prints' AND title != 'SOL TO SOUL Tour Poster';