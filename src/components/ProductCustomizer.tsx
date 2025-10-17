import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Image as ImageIcon, X } from 'lucide-react';
import { GalleryImagePicker } from './GalleryImagePicker';
import { StripeCheckout } from './StripeCheckout';

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
  const [customImage, setCustomImage] = useState<string>('');
  const [customImageName, setCustomImageName] = useState<string>('');
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large'>('medium');

  const handleImageSelect = (imageUrl: string, imageName: string) => {
    setCustomImage(imageUrl);
    setCustomImageName(imageName);
  };

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

  const getProductMockup = () => {
    const productTitle = product.title.toLowerCase();
    const category = product.category.toLowerCase();

    // Determine product type from title or category
    if (productTitle.includes('mug')) {
      return renderMugMockup();
    } else if (productTitle.includes('poster') || productTitle.includes('print') || category === 'prints') {
      return renderPosterMockup();
    } else if (productTitle.includes('hoodie') || productTitle.includes('zip hoodie')) {
      return renderHoodieMockup();
    } else if (productTitle.includes('pillow') || productTitle.includes('blanket') || productTitle.includes('tapestry')) {
      return renderHomeMockup();
    } else if (productTitle.includes('hat') || productTitle.includes('cap')) {
      return renderHatMockup();
    } else if (productTitle.includes('bag') || productTitle.includes('tote')) {
      return renderBagMockup();
    } else {
      // Default to t-shirt/apparel mockup
      return renderTShirtMockup();
    }
  };

  const renderTShirtMockup = () => (
    <svg 
      viewBox="0 0 200 240" 
      className="w-3/4 h-3/4 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <rect x="40" y="60" width="120" height="150" rx="5" />
      <rect x="10" y="60" width="35" height="60" rx="5" />
      <rect x="155" y="60" width="35" height="60" rx="5" />
      <path d="M 80 60 Q 100 50 120 60" fill="none" strokeWidth="2" />
    </svg>
  );

  const renderHoodieMockup = () => (
    <svg 
      viewBox="0 0 200 240" 
      className="w-3/4 h-3/4 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <rect x="40" y="70" width="120" height="150" rx="5" />
      <rect x="10" y="70" width="35" height="70" rx="5" />
      <rect x="155" y="70" width="35" height="70" rx="5" />
      <path d="M 70 70 Q 75 50 85 55 Q 95 40 100 40 Q 105 40 115 55 Q 125 50 130 70" fill="none" strokeWidth="2" />
      <ellipse cx="100" cy="100" rx="8" ry="15" fill="none" strokeWidth="2" />
    </svg>
  );

  const renderMugMockup = () => (
    <svg 
      viewBox="0 0 200 240" 
      className="w-2/3 h-2/3 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <ellipse cx="100" cy="80" rx="50" ry="10" />
      <rect x="50" y="80" width="100" height="100" />
      <ellipse cx="100" cy="180" rx="50" ry="10" />
      <path d="M 150 100 Q 170 100 170 130 Q 170 160 150 160" fill="none" strokeWidth="3" />
    </svg>
  );

  const renderPosterMockup = () => (
    <svg 
      viewBox="0 0 200 240" 
      className="w-3/4 h-3/4 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <rect x="40" y="30" width="120" height="180" rx="2" strokeWidth="3" />
      <rect x="35" y="25" width="130" height="190" rx="2" fill="none" strokeWidth="8" />
    </svg>
  );

  const renderHomeMockup = () => (
    <svg 
      viewBox="0 0 200 200" 
      className="w-3/4 h-3/4 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <rect x="30" y="30" width="140" height="140" rx="8" strokeWidth="2" />
      <path d="M 40 40 Q 50 35 60 40" fill="none" strokeWidth="1" opacity="0.3" />
      <path d="M 140 40 Q 150 35 160 40" fill="none" strokeWidth="1" opacity="0.3" />
    </svg>
  );

  const renderHatMockup = () => (
    <svg 
      viewBox="0 0 200 200" 
      className="w-3/4 h-3/4 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <ellipse cx="100" cy="140" rx="70" ry="15" />
      <path d="M 30 140 Q 30 80 100 60 Q 170 80 170 140" strokeWidth="2" />
      <ellipse cx="100" cy="60" rx="30" ry="8" />
    </svg>
  );

  const renderBagMockup = () => (
    <svg 
      viewBox="0 0 200 240" 
      className="w-3/4 h-3/4 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <rect x="45" y="80" width="110" height="130" rx="5" strokeWidth="2" />
      <path d="M 65 80 Q 65 50 100 50 Q 135 50 135 80" fill="none" strokeWidth="3" />
    </svg>
  );

  const getSizePercentage = () => {
    switch (imageSize) {
      case 'small': return 25;
      case 'medium': return 35;
      case 'large': return 45;
      default: return 35;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <Card className="max-w-6xl w-full my-8">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Design Your {product.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Customize with your favorite gallery image
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Product Preview */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Preview</h3>
                <div className="relative aspect-square bg-gradient-to-br from-muted to-card rounded-lg overflow-hidden border-2 border-border">
                  {/* Product mockup */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 flex items-center justify-center">
                        {getProductMockup()}
                      </div>

                      {/* Custom image overlay */}
                      {customImage && (
                        <div 
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                          style={{ 
                            width: `${getSizePercentage()}%`,
                            aspectRatio: '1',
                          }}
                        >
                          <img
                            src={customImage}
                            alt={customImageName}
                            className="w-full h-full object-contain rounded-lg shadow-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Placeholder when no image */}
                  {!customImage && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Choose a gallery image to preview</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Image size selector */}
                {customImage && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Print Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['small', 'medium', 'large'].map((size) => (
                        <Button
                          key={size}
                          variant={imageSize === size ? 'default' : 'outline'}
                          onClick={() => setImageSize(size as typeof imageSize)}
                          className="capitalize"
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Customization Options */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Customize</h3>

                  {/* Gallery Image Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gallery Image</label>
                    <Button
                      variant="outline"
                      className="w-full h-auto py-4"
                      onClick={() => setImagePickerOpen(true)}
                    >
                      {customImage ? (
                        <div className="flex items-center gap-3">
                          <img src={customImage} alt={customImageName} className="w-12 h-12 object-cover rounded" />
                          <div className="text-left">
                            <p className="font-medium">{customImageName}</p>
                            <p className="text-xs text-muted-foreground">Click to change</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-5 w-5" />
                          <span>Choose from Gallery</span>
                        </div>
                      )}
                    </Button>
                  </div>

                  {/* Variant Selection */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Size</label>
                      <div className="grid grid-cols-4 gap-2">
                        {product.variants.map((variant) => (
                          <Button
                            key={variant.id}
                            variant={selectedVariant === variant.id ? 'default' : 'outline'}
                            onClick={() => setSelectedVariant(variant.id)}
                            className="w-full"
                          >
                            {variant.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="pt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Base Price</span>
                      <span>${product.base_price.toFixed(2)}</span>
                    </div>
                    {selectedVariant && product.variants && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Size</span>
                        <span>
                          {product.variants.find(v => v.id === selectedVariant)?.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price and Checkout */}
                <div className="space-y-4 pt-6 border-t">
                  <div className="flex items-center justify-between text-xl">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">${calculatePrice().toFixed(2)}</span>
                  </div>
                  
                  {!customImage ? (
                    <Button className="w-full" size="lg" disabled>
                      Choose an Image First
                    </Button>
                  ) : (
                    <StripeCheckout
                      albumId={product.id}
                      albumTitle={`${product.title}${customImageName ? ` - ${customImageName}` : ''}`}
                      price={calculatePrice()}
                      onSuccess={onSuccess}
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Gallery Image Picker */}
      <GalleryImagePicker
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        onSelect={handleImageSelect}
      />
    </>
  );
}
