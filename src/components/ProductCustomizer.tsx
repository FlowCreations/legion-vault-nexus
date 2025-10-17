import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Image as ImageIcon, X, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

interface ProductCustomizerProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductCustomizer({ product, onClose, onSuccess }: ProductCustomizerProps) {
  const [selectedVariant, setSelectedVariant] = useState<string>(
    product.variants?.[0]?.id || ''
  );
  const [loading, setLoading] = useState(false);

  const calculatePrice = () => {
    let price = product.base_price;
    if (selectedVariant && product.variants) {
      const variant = product.variants.find(v => v.id === selectedVariant);
      if (variant) {
        price += variant.price_modifier;
      }
    }
    return price;
  };

  const selectedVariantData = product.variants?.find(v => v.id === selectedVariant);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Call edge function to create Stripe checkout session for gallery items
      const { data, error } = await supabase.functions.invoke('create-gallery-checkout', {
        body: {
          productId: product.id,
          productTitle: product.title,
          variantId: selectedVariant,
          customImageUrl: '',
          price: Math.round(calculatePrice() * 100), // Convert to cents
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout process');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <Card className="max-w-4xl w-full my-8">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{product.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Select your size
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Product Image */}
              <div className="space-y-4">
                <div className="relative aspect-square bg-muted rounded-lg overflow-hidden border-2 border-border">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              {/* Product Options */}
              <div className="space-y-6">
                <div>
                  <p className="text-muted-foreground mb-4">{product.description}</p>
                </div>

                {/* Size Selection */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold">Size</label>
                    <div className="grid grid-cols-5 gap-2">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant.id)}
                          className={`px-4 py-3 rounded-lg border-2 transition-all font-medium ${
                            selectedVariant === variant.id
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {variant.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-3 pt-6 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Base Price</span>
                    <span className="font-medium">${product.base_price.toFixed(2)}</span>
                  </div>
                  
                  {selectedVariantData && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Size: {selectedVariantData.name}</span>
                      <span className="font-medium">
                        {selectedVariantData.price_modifier > 0 ? '+' : ''}
                        ${selectedVariantData.price_modifier.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-2xl font-bold pt-3 border-t">
                    <span>Total</span>
                    <span>${calculatePrice().toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button 
                  onClick={handleCheckout}
                  disabled={loading || (!selectedVariant && product.variants && product.variants.length > 0)}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    "Loading..."
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Purchase ${calculatePrice().toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
