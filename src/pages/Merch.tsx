import { useState, useEffect } from "react";
import { Search, User, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const [activeCategory, setActiveCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
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
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const handleCustomizeProduct = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleCustomizerClose = () => {
    setSelectedProduct(null);
  };

  const handlePurchaseSuccess = () => {
    toast.success('Order placed successfully!');
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="bg-background-dark border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between gap-4 text-xs sm:text-sm text-muted-foreground">
            <span className="font-medium">Custom Merchandise with Gallery Art</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-background border-b border-border sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            {/* Search */}
            <button className="p-2 hover:bg-card rounded-lg transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {/* Logo/Title */}
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider text-center">
              SONS OF LEGION
            </h1>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-card rounded-lg transition-colors">
                <User className="w-5 h-5" />
              </button>
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
                <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-gradient-to-br from-card to-card-hover flex items-center justify-center">
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
                        onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}
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
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-12 tracking-wide text-muted-foreground">
            LEGION GEAR
          </h2>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-bold mb-2">No products available</h3>
              <p className="text-muted-foreground">
                Custom merchandise coming soon
              </p>
            </div>
          )}

          {!loading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden group">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
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
                        onClick={() => handleCustomizeProduct(product)}
                      >
                        Customize
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

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
    </div>
  );
}

const categories = [
  { id: "all", label: "ALL" },
  { id: "apparel", label: "APPAREL" },
  { id: "prints", label: "PRINTS" },
  { id: "accessories", label: "ACCESSORIES" },
  { id: "home", label: "HOME" },
];

const heroSlides = [
  {
    id: "1",
    title: "CUSTOM MERCH",
    subtitle: "Your gallery art on premium merchandise",
  },
  {
    id: "2",
    title: "GALLERY PRINTS",
    subtitle: "Transform your favorite images into wearable art",
  },
  {
    id: "3",
    title: "UNIQUE DESIGNS",
    subtitle: "Create one-of-a-kind merchandise with AI assistance",
  },
];
