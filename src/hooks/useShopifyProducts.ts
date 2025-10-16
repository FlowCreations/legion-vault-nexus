import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  compareAtPriceRange?: {
    minVariantPrice: {
      amount: string;
    };
  };
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
      };
    }>;
  };
  tags: string[];
  productType: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  badge?: string;
  onSale?: boolean;
  image?: string;
  handle: string;
}

export function useShopifyProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase.functions.invoke('shopify-products');

        if (error) throw error;

        const formattedProducts: Product[] = data.data.products.edges.map((edge: any) => {
          const product: ShopifyProduct = edge.node;
          const price = parseFloat(product.priceRange.minVariantPrice.amount);
          const compareAtPrice = product.compareAtPriceRange?.minVariantPrice?.amount
            ? parseFloat(product.compareAtPriceRange.minVariantPrice.amount)
            : undefined;

          // Determine category based on product type or tags
          let category = 'merch';
          if (product.productType.toLowerCase().includes('digital') || 
              product.tags.some(tag => tag.toLowerCase().includes('digital'))) {
            category = 'albums-digital';
          } else if (product.productType.toLowerCase().includes('cd') || 
                     product.tags.some(tag => tag.toLowerCase().includes('cd'))) {
            category = 'albums-cds';
          }

          return {
            id: product.id,
            name: product.title,
            category,
            price,
            originalPrice: compareAtPrice,
            inStock: true,
            badge: compareAtPrice && compareAtPrice > price ? 'SALE' : undefined,
            onSale: compareAtPrice ? compareAtPrice > price : false,
            image: product.images.edges[0]?.node.url,
            handle: product.handle,
          };
        });

        setProducts(formattedProducts);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching Shopify products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return { products, loading, error };
}
