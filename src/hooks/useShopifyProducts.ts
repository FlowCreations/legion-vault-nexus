import { useState, useEffect } from 'react';

const SHOPIFY_DOMAIN = 'sonsoflegion.com';
const STOREFRONT_ACCESS_TOKEN = 'ca6f21479ccf44c8b5817bd8e966c594';

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

const PRODUCTS_QUERY = `
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          description
          handle
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          tags
          productType
          availableForSale
        }
      }
    }
  }
`;

export function useShopifyProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
          },
          body: JSON.stringify({
            query: PRODUCTS_QUERY,
            variables: { first: 50 },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch products from Shopify');
        }

        const { data } = await response.json();
        
        const formattedProducts: Product[] = data.products.edges.map((edge: any) => {
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
