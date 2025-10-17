import { useState, useEffect } from 'react';
import { fetchProducts, ShopifyProduct as ShopifyProductType } from '@/lib/shopify';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  onSale: boolean;
  image: string;
  category: string;
  handle: string;
  available: boolean;
}

export function useShopifyProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const rawProducts = await fetchProducts();
        
        const formattedProducts: Product[] = rawProducts.map((item: ShopifyProductType) => {
          const { node } = item;
          const price = parseFloat(node.priceRange.minVariantPrice.amount);
          
          let category = 'Merch';
          
          return {
            id: node.id,
            title: node.title,
            description: node.description,
            price,
            compareAtPrice: null,
            onSale: false,
            image: node.images.edges[0]?.node.url || '',
            category,
            handle: node.handle,
            available: true
          };
        });
        
        setProducts(formattedProducts);
      } catch (err) {
        console.error('Error loading products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  return { products, loading, error };
}
