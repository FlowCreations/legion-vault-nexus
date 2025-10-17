import { useState } from "react";
import { ShoppingCart, Heart, Search, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";
import { CartDrawer } from "@/components/CartDrawer";

export default function Merch() {
  const [activeCategory, setActiveCategory] = useState("all");
  const { products, loading, error } = useShopifyProducts();

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.category.toLowerCase() === activeCategory);

  const handleProductClick = (handle: string) => {
    window.open(`https://sonsoflegion.com/products/${handle}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="bg-background-dark border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-foreground transition-colors">UK STORE</a>
              <span>|</span>
              <a href="#" className="hover:text-foreground transition-colors">AUS STORE</a>
            </div>
            <CartDrawer />
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
            MERCHANDISE
          </h2>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-destructive mb-4">{error}</p>
              <p className="text-muted-foreground">Please try again later.</p>
            </div>
          )}

          {!loading && !error && filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-bold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first product!
              </p>
              <p className="text-sm text-muted-foreground">
                Tell me what product you'd like to create (e.g., "Create a t-shirt for $29.99")
              </p>
            </div>
          )}

          {!loading && !error && filteredProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group cursor-pointer"
                  onClick={() => handleProductClick(product.handle)}
                >
                {/* Product Image */}
                <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-card">
                  {/* Badges */}
                  {product.onSale && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-primary text-primary-foreground border-0">
                        SALE
                      </Badge>
                    </div>
                  )}

                  {/* Wishlist */}
                  <button className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-4 h-4 text-black" />
                  </button>

                  {/* Product Image */}
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-card to-card-hover flex items-center justify-center p-8 group-hover:scale-105 transition-transform duration-500">
                      <div className="text-center w-full">
                        <div className="w-full aspect-square max-w-[100px] mx-auto bg-background/50 rounded-xl flex items-center justify-center mb-2 border border-border">
                          <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground/50">Product Image</p>
                      </div>
                    </div>
                  )}

                  {/* Quick Add Overlay */}
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button className="bg-white text-black hover:bg-white/90 font-medium">
                      QUICK ADD
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                    {product.title}
                  </h3>
                  
                  <div className="flex items-baseline gap-2">
                    {product.onSale && product.compareAtPrice ? (
                      <>
                        <span className="font-bold text-base text-primary">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.compareAtPrice.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="font-bold text-base">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const categories = [
  { id: "all", label: "ALL" },
  { id: "albums-digital", label: "ALBUMS - DIGITAL" },
  { id: "albums-cds", label: "ALBUMS - CDS" },
  { id: "merch", label: "MERCH" },
];

const heroSlides = [
  {
    id: "1",
    title: "OFFICIAL STORE",
    subtitle: "Shop exclusive Sons of Legion merchandise",
  },
  {
    id: "2",
    title: "NEW ARRIVALS",
    subtitle: "Fresh merchandise from the latest collection",
  },
  {
    id: "3",
    title: "LIMITED EDITION",
    subtitle: "Exclusive items available for a limited time",
  },
];
