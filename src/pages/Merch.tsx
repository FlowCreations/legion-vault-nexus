import { ShoppingCart, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Merch() {
  return (
    <div className="min-h-screen py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold mb-4">
            Merch
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Exclusive apparel and collectibles for true fans
          </p>
        </div>

        {/* Featured Product */}
        <div className="bg-gradient-to-br from-card to-card-hover rounded-3xl overflow-hidden mb-16 shadow-cosmic border border-border">
          <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
            {/* Product Image */}
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary-glow/10 shadow-gold flex items-center justify-center group hover:shadow-glow transition-all duration-500">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-gold rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Star className="w-16 h-16 text-primary-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Limited Edition</p>
              </div>
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-center">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 w-fit">
                Limited Release
              </Badge>
              
              <h2 className="font-serif text-4xl font-bold mb-4">
                Cosmic Echoes Hoodie
              </h2>
              
              <p className="text-muted-foreground mb-6 text-lg">
                Premium heavyweight cotton hoodie featuring exclusive album artwork. 
                Limited to 500 pieces worldwide.
              </p>

              <div className="mb-6">
                <div className="text-3xl font-bold mb-2">$89.99</div>
                <p className="text-sm text-muted-foreground">Free shipping on orders over $100</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="bg-gradient-gold hover:shadow-glow transition-all">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button size="lg" variant="outline" className="border-primary/30 hover:border-primary">
                  <Heart className="w-5 h-5 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div>
          <h2 className="font-serif text-3xl font-bold mb-8">All Products</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {merchProducts.map((product) => (
              <div
                key={product.id}
                className="group cursor-pointer"
              >
                {/* Product Image */}
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-card to-card-hover mb-4 shadow-cosmic group-hover:shadow-glow transition-all duration-500 relative overflow-hidden">
                  {product.badge && (
                    <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground border-0">
                      {product.badge}
                    </Badge>
                  )}

                  <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Cart button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button className="bg-primary/90 hover:bg-primary shadow-gold">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Quick Add
                    </Button>
                  </div>

                  {/* Placeholder product image */}
                  <div className="h-full flex items-center justify-center text-muted-foreground p-8">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-card rounded-xl flex items-center justify-center mx-auto mb-3">
                        <ShoppingCart className="w-10 h-10" />
                      </div>
                      <p className="text-xs opacity-50">Product Image</p>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="px-2">
                  <h3 className="font-serif text-lg font-bold mb-1 group-hover:text-primary transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2 line-clamp-1">
                    {product.category}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">${product.price}</span>
                    {product.inStock ? (
                      <span className="text-xs text-green-500">In Stock</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sold Out</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-16 bg-card/50 rounded-2xl p-8 border border-border text-center">
          <h3 className="font-serif text-2xl font-bold mb-3">Member Exclusive Discounts</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Premium members get 10% off all purchases. VIP members get 20% off plus early access to new drops.
          </p>
        </div>
      </div>
    </div>
  );
}

const merchProducts = [
  { id: "1", name: "Cosmic Echoes Hoodie", category: "Apparel", price: 89.99, inStock: true, badge: "Limited" },
  { id: "2", name: "Legion T-Shirt", category: "Apparel", price: 34.99, inStock: true },
  { id: "3", name: "Signed Album Bundle", category: "Music", price: 149.99, inStock: true, badge: "Exclusive" },
  { id: "4", name: "Tour Poster Set", category: "Collectibles", price: 45.00, inStock: true },
  { id: "5", name: "Premium Snapback", category: "Accessories", price: 39.99, inStock: false },
  { id: "6", name: "Vinyl Box Set", category: "Music", price: 199.99, inStock: true, badge: "New" },
  { id: "7", name: "Legion Beanie", category: "Accessories", price: 29.99, inStock: true },
  { id: "8", name: "Phone Case", category: "Accessories", price: 24.99, inStock: true },
];
