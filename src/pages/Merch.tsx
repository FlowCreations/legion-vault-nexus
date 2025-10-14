import { useState } from "react";
import { ShoppingCart, Heart, Search, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function Merch() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredProducts = activeCategory === "all" 
    ? allProducts 
    : allProducts.filter(p => p.category.toLowerCase() === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="bg-background-dark border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-end gap-4 text-xs sm:text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">UK STORE</a>
            <span>|</span>
            <a href="#" className="hover:text-foreground transition-colors">AUS STORE</a>
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
              <button className="p-2 hover:bg-card rounded-lg transition-colors">
                <ShoppingCart className="w-5 h-5" />
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

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group cursor-pointer"
              >
                {/* Product Image */}
                <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-card">
                  {/* Badges */}
                  {product.badge && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-primary text-primary-foreground border-0">
                        {product.badge}
                      </Badge>
                    </div>
                  )}

                  {/* Wishlist */}
                  <button className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-4 h-4 text-black" />
                  </button>

                  {/* Product Image Placeholder */}
                  <div className="h-full bg-gradient-to-br from-card to-card-hover flex items-center justify-center p-8 group-hover:scale-105 transition-transform duration-500">
                    <div className="text-center w-full">
                      <div className="w-full aspect-square max-w-[100px] mx-auto bg-background/50 rounded-xl flex items-center justify-center mb-2 border border-border">
                        <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground/50">Product Image</p>
                    </div>
                  </div>

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
                    {product.name}
                  </h3>
                  
                  <div className="flex items-baseline gap-2">
                    {product.onSale && product.originalPrice ? (
                      <>
                        <span className="font-bold text-base text-primary">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.originalPrice.toFixed(2)}
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
        </div>
      </section>
    </div>
  );
}

const categories = [
  { id: "all", label: "ALL" },
  { id: "new", label: "NEW ARRIVALS" },
  { id: "apparel", label: "APPAREL" },
  { id: "accessories", label: "ACCESSORIES" },
  { id: "music", label: "MUSIC" },
  { id: "posters", label: "POSTERS" },
  { id: "sale", label: "SALE" },
];

const heroSlides = [
  {
    id: "1",
    title: "SALE\n$10 POSTERS",
    subtitle: "Limited time offer on select poster designs",
  },
  {
    id: "2",
    title: "NEW ARRIVALS",
    subtitle: "Fresh merchandise from the latest collection",
  },
  {
    id: "3",
    title: "EXCLUSIVE VINYL",
    subtitle: "Limited edition vinyl pressing now available",
  },
];

const allProducts = [
  { 
    id: "1", 
    name: "Cosmic Echoes Limited Edition Hoodie", 
    category: "apparel", 
    price: 89.99, 
    inStock: true, 
    badge: "LIMITED",
  },
  { 
    id: "2", 
    name: "Classic Tour T-Shirt Black", 
    category: "apparel", 
    price: 34.99, 
    inStock: true,
  },
  { 
    id: "3", 
    name: "Signed Album Bundle", 
    category: "music", 
    price: 149.99, 
    originalPrice: 199.99,
    inStock: true, 
    badge: "SALE",
    onSale: true
  },
  { 
    id: "4", 
    name: "2025 World Tour Poster", 
    category: "posters", 
    price: 10.00, 
    originalPrice: 25.00,
    inStock: true,
    badge: "SALE",
    onSale: true
  },
  { 
    id: "5", 
    name: "Embroidered Snapback Cap", 
    category: "accessories", 
    price: 39.99, 
    inStock: true,
    badge: "NEW"
  },
  { 
    id: "6", 
    name: "Vinyl Box Set Complete Collection", 
    category: "music", 
    price: 199.99, 
    inStock: true, 
    badge: "LIMITED" 
  },
  { 
    id: "7", 
    name: "Legion Crest Beanie", 
    category: "accessories", 
    price: 29.99, 
    inStock: true,
  },
  { 
    id: "8", 
    name: "Phone Case Collection", 
    category: "accessories", 
    price: 24.99, 
    inStock: true 
  },
  { 
    id: "9", 
    name: "Long Sleeve Performance Tee", 
    category: "apparel", 
    price: 44.99, 
    originalPrice: 59.99,
    inStock: true,
    onSale: true,
    badge: "SALE"
  },
  { 
    id: "10", 
    name: "Red Rocks Show Poster", 
    category: "posters", 
    price: 10.00, 
    originalPrice: 25.00,
    inStock: true,
    badge: "SALE",
    onSale: true
  },
  { 
    id: "11", 
    name: "Deluxe Crewneck Sweatshirt", 
    category: "apparel", 
    price: 69.99, 
    inStock: true,
  },
  { 
    id: "12", 
    name: "Gold Edition Vinyl", 
    category: "music", 
    price: 49.99, 
    inStock: true,
    badge: "NEW"
  },
  { 
    id: "13", 
    name: "Leather Keychain Set", 
    category: "accessories", 
    price: 19.99, 
    inStock: true 
  },
  { 
    id: "14", 
    name: "Stadium Tour Raglan", 
    category: "apparel", 
    price: 39.99, 
    inStock: true,
  },
  { 
    id: "15", 
    name: "Concert Series Poster Set", 
    category: "posters", 
    price: 10.00, 
    originalPrice: 30.00,
    inStock: true,
    badge: "SALE",
    onSale: true
  },
  { 
    id: "16", 
    name: "Premium Tote Bag", 
    category: "accessories", 
    price: 34.99, 
    originalPrice: 44.99,
    inStock: true,
    onSale: true,
    badge: "SALE"
  },
];
