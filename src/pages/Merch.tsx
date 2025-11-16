import { useState, useEffect } from "react";
import { Search, Loader2, Image as ImageIcon, X, Eye, SlidersHorizontal } from "lucide-react";
import { PersonalitySurvey } from "@/components/PersonalitySurvey";
import { useSurveyTrigger } from "@/hooks/useSurveyTrigger";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductGridSkeleton } from "@/components/ui/skeleton-loaders";
import spinningRecord from "@/assets/spinning-record.mp4";
import apparelVideo from "@/assets/apparel-video.mp4";
import { useEventTracking } from "@/hooks/useEventTracking";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { ShopAssistant } from "@/components/ShopAssistant";
import { ProductCustomizer } from "@/components/ProductCustomizer";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cartStore";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";

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

export default function Merch() {
  const { trackEvent } = useEventTracking();
  const { t } = useTranslation();
  const { showSurvey, handleSurveyClose } = useSurveyTrigger('merch');
  const [activeCategory, setActiveCategory] = useState("apparel");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewSelectedSize, setQuickViewSelectedSize] = useState<string | null>(null);
  const [shopifyProducts, setShopifyProducts] = useState<ShopifyProduct[]>([]);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    loadShopifyProducts();
  }, []);

  const loadShopifyProducts = async () => {
    try {
      const products = await fetchProducts();
      setShopifyProducts(products);
    } catch (error) {
      // Error loading products
    }
  };

  useEffect(() => {
    fetchProductsFromDb();
  }, []);

  const fetchProductsFromDb = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          variants:product_variants(*)
        `)
        .eq('available', true);

      if (error) throw error;
      
      setProducts(data || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const titleUpper = p.title.toUpperCase();
    const isNewYorkProduct = titleUpper.includes('NYC') || 
                             titleUpper.includes('NEW YORK') || 
                             titleUpper.includes('NY ');
    // Only exclude tour merchandise from apparel, not tour posters from prints
    const isTourApparel = p.category === 'apparel' && titleUpper.includes('TOUR');
    return p.category === activeCategory && !isNewYorkProduct && !isTourApparel;
  });

  const searchedProducts = searchQuery
    ? filteredProducts.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredProducts;

  const priceFilteredProducts = searchedProducts.filter(
    p => p.base_price >= priceRange[0] && p.base_price <= priceRange[1]
  );

  const sortedProducts = [...priceFilteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.base_price - b.base_price;
      case "price-high":
        return b.base_price - a.base_price;
      default:
        return 0;
    }
  });

  // Helper function to get custom image scale for specific products
  const getImageScale = (title: string): string => {
    const upperTitle = title.toUpperCase();
    
    // Bandanas need larger scale
    if (upperTitle.includes('BANDANA - ORANGE')) return 'scale-[1.4]';
    if (upperTitle.includes('BANDANA - GREEN')) return 'scale-[1.2]';
    
    // Stickers need larger scale
    if (upperTitle.includes('EAGLE STICKER')) return 'scale-[1.3]';
    if (upperTitle.includes('LOGO STICKER')) return 'scale-[1.3]';
    
    // Keychains need larger scale
    if (upperTitle.includes('KEYCHAIN')) return 'scale-[1.4]';
    
    // Beer/coffee sleeves might need adjustment
    if (upperTitle.includes('BEER CAN COOLER')) return 'scale-[1.2]';
    if (upperTitle.includes('COFFEE SLEEVE')) return 'scale-[1.2]';
    
    // Prints/Posters need larger scale
    if (upperTitle.includes('POSTER') || upperTitle.includes('PRINT')) return 'scale-[1.35]';
    
    return 'scale-100'; // Default scale
  };

  // Helper function to get custom positioning for specific products
  const getImagePosition = (title: string): string => {
    const upperTitle = title.toUpperCase();
    
    // Green bandana needs to be moved down slightly to center better
    if (upperTitle.includes('BANDANA - GREEN')) return 'translate-y-1';
    
    // Prints/Posters need to be centered vertically
    if (upperTitle.includes('POSTER') || upperTitle.includes('PRINT')) return 'translate-y-2';
    
    return ''; // Default no translation
  };


  const handleAddToCart = async (product: Product) => {
    trackEvent('add_to_cart', {
      id: product.id,
      name: product.title,
      category: product.category,
      price: product.base_price
    });

    // For products with variants, open customizer
    if (product.variants && product.variants.length > 0) {
      setSelectedProduct(product);
      return;
    }
    
    // Create a Shopify-compatible product structure from Supabase product
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

  const handleCustomizerClose = () => {
    setSelectedProduct(null);
  };

  const handleQuickViewAddToCart = (product: Product, selectedSize: string | null) => {
    trackEvent('add_to_cart', {
      id: product.id,
      name: product.title,
      category: product.category,
      price: product.base_price,
      size: selectedSize
    });

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

  const handlePurchaseSuccess = () => {
    toast.success('Order placed successfully!');
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Coming Soon Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Card className="mb-8 p-8 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <h2 className="text-3xl font-bold text-primary mb-4">🎸 Merch Store Coming Soon! 🎸</h2>
          <p className="text-muted-foreground text-lg mb-4">
            We're crafting exclusive Sons of Legion merchandise just for you.
          </p>
          <p className="text-sm text-muted-foreground">
            Subscribe to our newsletter to be the first to know when the store launches!
          </p>
        </Card>
      </div>

      {/* Header */}
      <header className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            {/* Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('merch.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Logo/Title - Absolutely centered */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider whitespace-nowrap">
                {t('merch.title')}
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <SlidersHorizontal className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>{t('common.filters')}</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 py-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('common.sortBy')}</label>
                      <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">{t('common.newest')}</SelectItem>
                          <SelectItem value="price-low">{t('common.priceLowToHigh')}</SelectItem>
                          <SelectItem value="price-high">{t('common.priceHighToLow')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {t('common.priceRange')}: ${priceRange[0]} - ${priceRange[1]}
                      </label>
                      <Slider
                        value={priceRange}
                        onValueChange={(value) => setPriceRange(value as [number, number])}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center justify-center gap-4 sm:gap-6 pb-4 overflow-x-auto scrollbar-hide text-sm">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap py-2 px-3 hover:text-primary transition-colors ${
                  activeCategory === cat.id ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero Carousel */}
      <section className="relative bg-background-dark">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {heroSlides.map((slide) => (
              <CarouselItem key={slide.id}>
                <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-gradient-to-br from-card to-card-hover flex items-center justify-center overflow-hidden">
                  {slide.id === "2" && (
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    >
                      <source src={spinningRecord} type="video/mp4" />
                    </video>
                  )}
                  {slide.id === "3" && (
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    >
                      <source src={apparelVideo} type="video/mp4" />
                    </video>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-background-dark/90 via-background-dark/50 to-transparent" />
                  
                  <div className="relative z-10 max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 w-full">
                    <div className="max-w-xl">
                      <h2 className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 leading-tight">
                        {slide.title}
                      </h2>
                      <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                        {slide.subtitle}
                      </p>
                      <Button 
                        size="lg" 
                        className="bg-white text-black hover:bg-white/90 font-medium px-12 py-6 text-base"
                        onClick={() => {
                          setActiveCategory("albums");
                          window.scrollTo({ top: 600, behavior: 'smooth' });
                        }}
                      >
                        SHOP NOW
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
      </section>


      {/* Products Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-wide text-muted-foreground">
              {t('merch.section.title')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'}
            </p>
          </div>

          {loading && (
            <ProductGridSkeleton />
          )}

          {!loading && sortedProducts.length === 0 && (
            <div className="text-center py-20">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-bold mb-2">No products available</h3>
              <p className="text-muted-foreground">
                Custom merchandise coming soon
              </p>
            </div>
          )}

          {!loading && sortedProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {sortedProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="overflow-hidden group relative cursor-pointer"
                  onClick={() => {
                    if (product.variants && product.variants.length > 0) {
                      setSelectedProduct(product);
                    } else {
                      handleAddToCart(product);
                    }
                  }}
                >
                  <div className="relative aspect-square overflow-hidden bg-white">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className={`w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 ${getImageScale(product.title)} ${getImagePosition(product.title)}`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center">
                              <svg class="h-12 w-12 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                <circle cx="9" cy="9" r="2"/>
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                              </svg>
                            </div>
                          `;
                        }}
                        loading="eager"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {/* Quick View Button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickViewProduct(product);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
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
          )}
        </div>
      </section>

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
                      <ImageIcon className="h-16 w-16 text-muted-foreground" />
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

      {/* Product Customizer */}
      {selectedProduct && (
        <ProductCustomizer
          product={selectedProduct}
          onClose={handleCustomizerClose}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {/* AI Shop Assistant */}
      <ShopAssistant />

      {/* Personality Survey */}
      <PersonalitySurvey isOpen={showSurvey} onClose={handleSurveyClose} />
    </div>
  );
}

const categories = [
  { id: "apparel", label: "APPAREL" },
  { id: "accessories", label: "ACCESSORIES" },
  { id: "prints", label: "PRINTS" },
  { id: "albums", label: "ALBUMS" },
];

const heroSlides = [
  {
    id: "2",
    title: "PHYSICAL ALBUMS",
    subtitle: "Get the latest albums on CD and Vinyl",
  },
  {
    id: "3",
    title: "OFFICIAL MERCH",
    subtitle: "Exclusive Sons of Legion merchandise",
  },
];
