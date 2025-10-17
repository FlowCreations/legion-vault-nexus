-- Update all product titles and descriptions to use SØL instead of SOL
UPDATE products 
SET title = REPLACE(title, 'SOL', 'SØL')
WHERE title LIKE '%SOL%';

UPDATE products 
SET description = REPLACE(description, 'SOL', 'SØL')
WHERE description LIKE '%SOL%';

UPDATE products 
SET description = REPLACE(description, 'Sons of Legion', 'Sons of Legion')
WHERE description LIKE '%Sons of Legion%';