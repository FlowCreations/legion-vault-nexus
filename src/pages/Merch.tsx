import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Merch() {
  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden mt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-background-dark via-card to-background-dark">
          <div className="absolute inset-0 bg-gradient-overlay opacity-40" />
        </div>

        <div className="relative z-10 text-center px-4">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 text-lg px-6 py-2">
            Limited Time Offer
          </Badge>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold mb-6">
            New Collection
            <br />
            <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Just Dropped
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Exclusive merchandise from the Cosmic Echoes era
          </p>
          <Button size="lg" className="bg-gradient-gold hover:shadow-glow transition-all text-lg px-8">
            Shop Now
          </Button>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full justify-start mb-12 bg-card/50 p-2 h-auto flex-wrap gap-2">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3">
                All Products
              </TabsTrigger>
              <TabsTrigger value="apparel" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3">
                Apparel
              </TabsTrigger>
              <TabsTrigger value="accessories" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3">
                Accessories
              </TabsTrigger>
              <TabsTrigger value="music" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3">
                Music
              </TabsTrigger>
              <TabsTrigger value="collectibles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3">
                Collectibles
              </TabsTrigger>
              <TabsTrigger value="sale" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3">
                Sale
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <ProductGrid products={allProducts} />
            </TabsContent>

            <TabsContent value="apparel" className="mt-0">
              <ProductGrid products={allProducts.filter(p => p.category === "Apparel")} />
            </TabsContent>

            <TabsContent value="accessories" className="mt-0">
              <ProductGrid products={allProducts.filter(p => p.category === "Accessories")} />
            </TabsContent>

            <TabsContent value="music" className="mt-0">
              <ProductGrid products={allProducts.filter(p => p.category === "Music")} />
            </TabsContent>

            <TabsContent value="collectibles" className="mt-0">
              <ProductGrid products={allProducts.filter(p => p.category === "Collectibles")} />
            </TabsContent>

            <TabsContent value="sale" className="mt-0">
              <ProductGrid products={allProducts.filter(p => p.onSale)} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Member Benefits Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
            Exclusive Member Benefits
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Premium members get 10% off all purchases. VIP members get 20% off plus early access to new drops and limited editions.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="bg-gradient-gold hover:shadow-glow transition-all">
              Become a Member
            </Button>
            <Button size="lg" variant="outline" className="border-primary/30 hover:border-primary">
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductGrid({ products }: { products: typeof allProducts }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="group cursor-pointer"
        >
          {/* Product Image */}
          <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-card shadow-cosmic group-hover:shadow-glow transition-all duration-500">
            {/* Badges */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
              <div className="flex flex-col gap-2">
                {product.badge && (
                  <Badge className="bg-primary/90 text-primary-foreground border-0 shadow-gold">
                    {product.badge}
                  </Badge>
                )}
                {product.onSale && (
                  <Badge className="bg-destructive/90 text-destructive-foreground border-0">
                    Sale
                  </Badge>
                )}
              </div>
              
              <button className="w-8 h-8 rounded-full bg-background-dark/80 backdrop-blur-sm flex items-center justify-center hover:bg-background-dark transition-colors opacity-0 group-hover:opacity-100">
                <Heart className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Quick Add Button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              <Button className="bg-primary/95 hover:bg-primary shadow-gold">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Quick Add
              </Button>
            </div>

            {/* Product Image Placeholder */}
            <div className="h-full bg-gradient-to-br from-card to-card-hover flex items-center justify-center p-8">
              <div className="text-center w-full">
                <div className="w-full aspect-square max-w-[120px] mx-auto bg-card/50 rounded-xl flex items-center justify-center mb-3 border border-border">
                  <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground/50">Product Image</p>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm sm:text-base group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
              {product.name}
            </h3>
            
            <div className="flex items-baseline gap-2">
              {product.onSale && product.originalPrice ? (
                <>
                  <span className="font-bold text-base sm:text-lg text-primary">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="font-bold text-base sm:text-lg">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              {product.inStock ? (
                <span className="text-green-500">In Stock</span>
              ) : (
                <span className="text-muted-foreground">Sold Out</span>
              )}
              {product.colors && (
                <span className="text-muted-foreground">{product.colors} colors</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const allProducts = [
  { 
    id: "1", 
    name: "Cosmic Echoes Limited Edition Hoodie", 
    category: "Apparel", 
    price: 89.99, 
    inStock: true, 
    badge: "Limited",
    colors: 3
  },
  { 
    id: "2", 
    name: "Sons of Legion Classic Tour Tee", 
    category: "Apparel", 
    price: 34.99, 
    inStock: true,
    colors: 5
  },
  { 
    id: "3", 
    name: "Signed Album Bundle - Cosmic Echoes", 
    category: "Music", 
    price: 149.99, 
    originalPrice: 199.99,
    inStock: true, 
    badge: "Exclusive",
    onSale: true
  },
  { 
    id: "4", 
    name: "2025 World Tour Poster Set", 
    category: "Collectibles", 
    price: 45.00, 
    inStock: true 
  },
  { 
    id: "5", 
    name: "Premium Embroidered Snapback", 
    category: "Accessories", 
    price: 39.99, 
    inStock: false 
  },
  { 
    id: "6", 
    name: "Vinyl Box Set - Complete Collection", 
    category: "Music", 
    price: 199.99, 
    inStock: true, 
    badge: "New" 
  },
  { 
    id: "7", 
    name: "Legion Crest Beanie", 
    category: "Accessories", 
    price: 29.99, 
    inStock: true,
    colors: 4
  },
  { 
    id: "8", 
    name: "Cosmic Echoes Phone Case", 
    category: "Accessories", 
    price: 24.99, 
    inStock: true 
  },
  { 
    id: "9", 
    name: "Long Sleeve Performance Tee", 
    category: "Apparel", 
    price: 44.99, 
    originalPrice: 59.99,
    inStock: true,
    onSale: true,
    colors: 3
  },
  { 
    id: "10", 
    name: "Limited Edition Poster - Red Rocks", 
    category: "Collectibles", 
    price: 35.00, 
    inStock: true,
    badge: "Limited"
  },
  { 
    id: "11", 
    name: "Deluxe Crewneck Sweatshirt", 
    category: "Apparel", 
    price: 69.99, 
    inStock: true,
    colors: 2
  },
  { 
    id: "12", 
    name: "Cosmic Echoes Vinyl - Gold Edition", 
    category: "Music", 
    price: 49.99, 
    inStock: false,
    badge: "Sold Out"
  },
  { 
    id: "13", 
    name: "Leather Keychain Set", 
    category: "Accessories", 
    price: 19.99, 
    inStock: true 
  },
  { 
    id: "14", 
    name: "Stadium Tour Raglan Tee", 
    category: "Apparel", 
    price: 39.99, 
    inStock: true,
    colors: 3
  },
  { 
    id: "15", 
    name: "Autographed Lyric Book", 
    category: "Collectibles", 
    price: 79.99, 
    inStock: true,
    badge: "Exclusive"
  },
  { 
    id: "16", 
    name: "Premium Tote Bag", 
    category: "Accessories", 
    price: 34.99, 
    originalPrice: 44.99,
    inStock: true,
    onSale: true
  },
];
