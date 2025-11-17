import { useState, useEffect } from "react";
import { Download, ArrowLeft, Mail, Loader2, ShoppingCart, X, Eye } from "lucide-react";
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
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewSelectedSize, setQuickViewSelectedSize] = useState<string | null>(null);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    window.scrollTo(0, 0);
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

  const handleItemClick = async (item: GalleryItem) => {
    // For Social Media Quality - direct download
    if (item.id === 'social-media') {
      const link = document.createElement('a');
      link.href = item.image;
      link.download = `social-media-quality-${Date.now()}.jpg`;
      link.click();
      toast.success("Download started!");
      return;
    }

    // For Low Res - check if user is signed in
    if (item.id === 'low-res') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Direct download for signed-in users
        const link = document.createElement('a');
        link.href = item.image;
        link.download = `low-res-${Date.now()}.jpg`;
        link.click();
        toast.success("Download started!");
        return;
      }
      // Not signed in - open email dialog
      setSelectedItem(item);
      return;
    }

    // For High Res - open checkout dialog
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
      // Send only itemId - server will validate and set price
      const { data, error } = await supabase.functions.invoke('create-gallery-checkout', {
        body: {
          itemId: selectedItem.id,
          clientPrice: parseFloat(selectedItem.price.replace('$', ''))
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

  const handleAddPhotoToCart = (item: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Create a Shopify-compatible product structure for the photo
    const mockShopifyProduct: ShopifyProduct = {
      node: {
        id: item.id,
        title: item.title,
        description: 'High resolution print quality photo',
        handle: item.title.toLowerCase().replace(/\s+/g, '-'),
        priceRange: {
          minVariantPrice: {
            amount: item.price.replace('$', ''),
            currencyCode: 'USD'
          }
        },
        images: {
          edges: [{
            node: {
              url: item.image,
              altText: item.title
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: `gid://shopify/ProductVariant/${item.id}`,
              title: 'Default',
              price: {
                amount: item.price.replace('$', ''),
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
    
    toast.success(`${item.title} added to cart!`);
  };

  const handleQuickViewAddToCart = (product: Product, selectedSize: string | null) => {
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
              title: selectedSize || 'Default',
              price: {
                amount: product.base_price.toString(),
                currencyCode: 'USD'
              },
              availableForSale: true,
              selectedOptions: selectedSize ? [{ name: 'Size', value: selectedSize }] : []
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
    
    toast.success(`${product.title}${selectedSize ? ` (${selectedSize})` : ''} added to cart!`);
    setQuickViewProduct(null);
    setQuickViewSelectedSize(null);
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
              <Card
                key={item.id}
                className="overflow-hidden group"
              >
                <div className="aspect-square relative overflow-hidden bg-background-dark">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="text-sm font-medium">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    {item.isFree ? (
                      <>
                        <Badge variant="secondary" className="bg-green-600 text-white">
                          FREE
                        </Badge>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleItemClick(item)}
                          className="border-foreground text-foreground hover:bg-foreground hover:text-background font-normal tracking-wide uppercase"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-primary">{item.price}</span>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleItemClick(item)}
                          className="border-foreground text-foreground hover:bg-foreground hover:text-background font-normal tracking-wide uppercase"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Purchase
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
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
                  {/* Quick View Button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickViewProduct(product);
                      }}
                    >
                      Quick View
                    </Button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm sm:text-base">{product.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base sm:text-lg">${product.base_price.toFixed(2)}</span>
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

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{quickViewProduct.title}</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setQuickViewProduct(null);
                    setQuickViewSelectedSize(null);
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  {quickViewProduct.image_url ? (
                    <img src={quickViewProduct.image_url} alt={quickViewProduct.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <p className="text-muted-foreground">{quickViewProduct.description}</p>
                  <div className="text-3xl font-bold">${quickViewProduct.base_price.toFixed(2)}</div>
                  {quickViewProduct.variants && quickViewProduct.variants.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Select Size</label>
                      <div className="flex flex-wrap gap-2">
                        {quickViewProduct.variants.map((variant) => (
                          <Button
                            key={variant.id}
                            variant={quickViewSelectedSize === variant.name ? "default" : "outline"}
                            size="sm"
                            onClick={() => setQuickViewSelectedSize(variant.name)}
                            className="min-w-[60px]"
                          >
                            {variant.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" 
                    size="lg"
                    disabled={quickViewProduct.variants && quickViewProduct.variants.length > 0 && !quickViewSelectedSize}
                    onClick={() => handleQuickViewAddToCart(quickViewProduct, quickViewSelectedSize)}
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

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
    id: "low-res",
    title: "Low Res",
    image: show1,
    price: "FREE",
    isFree: true,
  },
  {
    id: "social-media",
    title: "Social Media Quality",
    image: show1,
    price: "FREE",
    isFree: true,
  },
  {
    id: "high-res",
    title: "High Res",
    image: show1,
    price: "$14.99",
    isFree: false,
  },
];
