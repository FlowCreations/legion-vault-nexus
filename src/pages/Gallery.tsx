import { useState, useEffect } from "react";
import { Download, ArrowLeft, Mail, Loader2, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProductCustomizer } from "@/components/ProductCustomizer";
import { useCartStore } from "@/stores/cartStore";
import { ShopifyProduct } from "@/lib/shopify";
import show1 from "@/assets/shows/show-1.jpg";
import show2 from "@/assets/shows/show-2.jpg";
import show3 from "@/assets/shows/show-3.jpg";

interface GalleryItem {
  id: string;
  title: string;
  image: string;
  price: string;
  isFree?: boolean;
}

interface Product {
  id: string;
  title: string;
  description: string;
  base_price: number;
  category: string;
  image_url?: string;
  variants?: Array<{
    id: string;
    name: string;
    price_modifier: number;
  }>;
}

export default function Gallery() {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nyProducts, setNyProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    fetchNYProducts();
  }, []);

  const fetchNYProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          variants:product_variants(*)
        `)
        .eq('available', true)
        .or('category.eq.accessories,category.eq.apparel')
        .ilike('title', '%NYC%');

      if (error) throw error;
      setNyProducts(data || []);
    } catch (error) {
      console.error('Error fetching NY products:', error);
    }
  };

  const handleItemClick = (item: GalleryItem) => {
    setSelectedItem(item);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedItem) return;

    setIsLoading(true);
    try {
      // Store email signup for free content
      const { error } = await supabase
        .from('user_events')
        .insert({
          session_id: crypto.randomUUID(),
          event_type: 'free_content_signup',
          event_data: {
            item_title: selectedItem.title,
            email: email
          }
        });

      if (error) throw error;

      toast.success("Check your email!", {
        description: "We've sent you the download link."
      });
      
      setSelectedItem(null);
      setEmail("");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedItem) return;
    
    setIsLoading(true);
    try {
      // Create checkout session
      const { data, error } = await supabase.functions.invoke('create-gallery-checkout', {
        body: {
          item: {
            title: selectedItem.title,
            price: parseFloat(selectedItem.price.replace('$', '')),
            image: selectedItem.image
          }
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // For products with variants, open customizer
    if (product.variants && product.variants.length > 0) {
      setSelectedProduct(product);
      return;
    }
    
    // Create a Shopify-compatible product structure
    const mockShopifyProduct: ShopifyProduct = {
      node: {
        id: product.id,
        title: product.title,
        description: product.description || '',
        handle: product.title.toLowerCase().replace(/\s+/g, '-'),
        priceRange: {
          minVariantPrice: {
            amount: product.base_price.toString(),
            currencyCode: 'USD'
          }
        },
        images: {
          edges: product.image_url ? [{
            node: {
              url: product.image_url,
              altText: product.title
            }
          }] : []
        },
        variants: {
          edges: [{
            node: {
              id: `gid://shopify/ProductVariant/${product.id}`,
              title: 'Default',
              price: {
                amount: product.base_price.toString(),
                currencyCode: 'USD'
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    };
    
    const variant = mockShopifyProduct.node.variants.edges[0].node;
    
    addItem({
      product: mockShopifyProduct,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions
    });
    
    toast.success(`${product.title} added to cart!`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/shows')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shows
        </Button>
      </div>

      {/* Hero Banner */}
      <section className="relative aspect-[21/9] bg-background-dark overflow-hidden mb-12">
        <img
          src={show1}
          alt="Concert venue"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-center">
                <div className="text-xs text-white/70 uppercase">Mar</div>
                <div className="text-2xl font-bold text-white">15</div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2">
                  New York, NY
                </h1>
                <p className="text-xl text-white/80">Madison Square Garden</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {socialReadyPhotos.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-all duration-300 group cursor-pointer"
              >
                <div className="aspect-square relative overflow-hidden bg-background-dark">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-sm font-medium bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                      {item.isFree ? 'Get Free Download' : 'Purchase'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-lg font-bold text-primary">{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New York Merch */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">New York Merch</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nyProducts.map((product) => (
              <Card 
                key={product.id}
                className="overflow-hidden group relative"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm sm:text-base">{product.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base sm:text-lg">${product.base_price.toFixed(2)}</span>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleAddToCart(product, e)}
                      className="border-foreground text-foreground hover:bg-foreground hover:text-background font-normal tracking-wide uppercase"
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modal for Free Items or Checkout */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
            <DialogDescription>
              {selectedItem?.isFree 
                ? "Enter your email to receive the download link" 
                : "Complete your purchase"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-background-dark">
              <img 
                src={selectedItem?.image} 
                alt={selectedItem?.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{selectedItem?.price}</span>
            </div>

            {selectedItem?.isFree ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Get Free Download
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <Button 
                onClick={handleCheckout} 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Checkout
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Customizer for NY Merch */}
      {selectedProduct && (
        <ProductCustomizer
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSuccess={() => {
            toast.success('Order placed successfully!');
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

const socialReadyPhotos: GalleryItem[] = [
  {
    id: "1",
    title: "Download social ready photos",
    image: show1,
    price: "FREE",
    isFree: true,
  },
  {
    id: "3",
    title: "High resolution print quality photos",
    image: show3,
    price: "$14.99",
    isFree: false,
  },
];
