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
    } else if (productTitle.includes('water bottle') || productTitle.includes('bottle')) {
      return renderWaterBottleMockup();
    } else if (productTitle.includes('canvas')) {
      return renderCanvasMockup();
    } else if (productTitle.includes('metal print')) {
      return renderMetalPrintMockup();
    } else if (productTitle.includes('framed') || productTitle.includes('poster')) {
      return renderFramedPrintMockup();
    } else if (productTitle.includes('hoodie') || productTitle.includes('zip hoodie')) {
      return renderHoodieMockup();
    } else if (productTitle.includes('sweatshirt')) {
      return renderSweatshirtMockup();
    } else if (productTitle.includes('tank top')) {
      return renderTankTopMockup();
    } else if (productTitle.includes('pillow')) {
      return renderPillowMockup();
    } else if (productTitle.includes('blanket') || productTitle.includes('tapestry')) {
      return renderBlanketMockup();
    } else if (productTitle.includes('hat') || productTitle.includes('cap') || productTitle.includes('beanie')) {
      return renderHatMockup();
    } else if (productTitle.includes('backpack')) {
      return renderBackpackMockup();
    } else if (productTitle.includes('tote') || productTitle.includes('bag')) {
      return renderBagMockup();
    } else if (productTitle.includes('bandana')) {
      return renderBandanaMockup();
    } else if (productTitle.includes('sticker')) {
      return renderStickerMockup();
    } else if (productTitle.includes('keychain') || productTitle.includes('key chain')) {
      return renderKeychainMockup();
    } else if (productTitle.includes('pin') || productTitle.includes('button')) {
      return renderPinMockup();
    } else if (productTitle.includes('phone case')) {
      return renderPhoneCaseMockup();
    } else if (productTitle.includes('laptop sleeve')) {
      return renderLaptopSleeveMockup();
    } else if (category === 'prints') {
      return renderFramedPrintMockup();
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

  const renderSweatshirtMockup = () => (
    <svg 
      viewBox="0 0 200 240" 
      className="w-3/4 h-3/4 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <rect x="40" y="65" width="120" height="145" rx="5" />
      <rect x="10" y="65" width="35" height="65" rx="5" />
      <rect x="155" y="65" width="35" height="65" rx="5" />
      <ellipse cx="100" cy="75" rx="15" ry="8" fill="none" strokeWidth="2" />
      <rect x="40" y="200" width="120" height="10" rx="3" fill="none" strokeWidth="1.5" />
    </svg>
  );

  const renderTankTopMockup = () => (
    <svg 
      viewBox="0 0 200 240" 
      className="w-3/4 h-3/4 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <rect x="50" y="60" width="100" height="140" rx="5" />
      <path d="M 50 60 L 40 80 L 40 110 L 50 100" fill="none" strokeWidth="2" />
      <path d="M 150 60 L 160 80 L 160 110 L 150 100" fill="none" strokeWidth="2" />
      <ellipse cx="100" cy="70" rx="20" ry="12" fill="none" strokeWidth="2" />
    </svg>
  );

  const renderCanvasMockup = () => (
    <svg 
      viewBox="0 0 200 240" 
      className="w-3/4 h-3/4 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <rect x="35" y="30" width="130" height="180" rx="3" strokeWidth="3" />
      <rect x="40" y="35" width="120" height="170" rx="2" fill="none" strokeWidth="1" opacity="0.3" />
      <line x1="35" y1="30" x2="40" y2="35" strokeWidth="2" />
      <line x1="165" y1="30" x2="160" y2="35" strokeWidth="2" />
      <line x1="35" y1="210" x2="40" y2="205" strokeWidth="2" />
      <line x1="165" y1="210" x2="160" y2="205" strokeWidth="2" />
    </svg>
  );

  const renderMetalPrintMockup = () => (
    <svg 
      viewBox="0 0 200 240" 
      className="w-3/4 h-3/4 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' }}
    >
      <defs>
        <linearGradient id="metal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopOpacity="0.1" />
          <stop offset="50%" stopOpacity="0.05" />
          <stop offset="100%" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <rect x="40" y="30" width="120" height="180" rx="1" strokeWidth="4" />
      <rect x="40" y="30" width="120" height="180" fill="url(#metal-gradient)" />
      <circle cx="150" cy="40" r="3" fill="currentColor" opacity="0.3" />
    </svg>
  );

  const renderFramedPrintMockup = () => (
    <svg 
      viewBox="0 0 200 240" 
      className="w-3/4 h-3/4 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <rect x="30" y="25" width="140" height="190" rx="2" strokeWidth="8" />
      <rect x="45" y="40" width="110" height="160" rx="1" strokeWidth="2" />
    </svg>
  );

  const renderPillowMockup = () => (
    <svg 
      viewBox="0 0 200 200" 
      className="w-3/4 h-3/4 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <rect x="30" y="50" width="140" height="100" rx="12" strokeWidth="2" />
      <path d="M 35 70 Q 30 75 35 80" fill="none" strokeWidth="1" opacity="0.2" />
      <path d="M 165 70 Q 170 75 165 80" fill="none" strokeWidth="1" opacity="0.2" />
      <line x1="30" y1="100" x2="170" y2="100" strokeWidth="1" opacity="0.1" strokeDasharray="5,5" />
    </svg>
  );

  const renderBlanketMockup = () => (
    <svg 
      viewBox="0 0 200 240" 
      className="w-3/4 h-3/4 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <path d="M 40 50 Q 35 70 40 90 L 40 180 Q 35 200 40 220 L 160 220 Q 165 200 160 180 L 160 90 Q 165 70 160 50 Z" strokeWidth="2" />
      <line x1="50" y1="50" x2="50" y2="220" strokeWidth="1" opacity="0.15" />
      <line x1="150" y1="50" x2="150" y2="220" strokeWidth="1" opacity="0.15" />
    </svg>
  );

  const renderBandanaMockup = () => (
    <svg 
      viewBox="0 0 200 200" 
      className="w-3/4 h-3/4 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <path d="M 100 30 L 170 100 L 100 170 L 30 100 Z" strokeWidth="2" />
      <circle cx="70" cy="70" r="3" fill="currentColor" opacity="0.3" />
      <circle cx="130" cy="70" r="3" fill="currentColor" opacity="0.3" />
      <circle cx="70" cy="130" r="3" fill="currentColor" opacity="0.3" />
      <circle cx="130" cy="130" r="3" fill="currentColor" opacity="0.3" />
      <circle cx="100" cy="100" r="3" fill="currentColor" opacity="0.3" />
    </svg>
  );

  const renderPinMockup = () => (
    <svg 
      viewBox="0 0 200 200" 
      className="w-1/2 h-1/2 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' }}
    >
      <circle cx="100" cy="100" r="60" strokeWidth="4" />
      <circle cx="100" cy="100" r="55" strokeWidth="1" opacity="0.2" />
      <rect x="95" y="155" width="10" height="25" rx="2" strokeWidth="1.5" />
    </svg>
  );

  const renderPhoneCaseMockup = () => (
    <svg 
      viewBox="0 0 200 240" 
      className="w-1/2 h-1/2 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' }}
    >
      <rect x="60" y="40" width="80" height="160" rx="8" strokeWidth="3" />
      <rect x="65" y="45" width="70" height="150" rx="6" fill="none" strokeWidth="1.5" opacity="0.3" />
      <circle cx="100" cy="55" r="3" fill="currentColor" opacity="0.4" />
      <rect x="85" y="175" width="30" height="4" rx="2" fill="currentColor" opacity="0.4" />
      <circle cx="130" cy="60" r="8" fill="none" strokeWidth="2" />
    </svg>
  );

  const renderLaptopSleeveMockup = () => (
    <svg 
      viewBox="0 0 200 200" 
      className="w-3/4 h-3/4 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <rect x="30" y="50" width="140" height="100" rx="5" strokeWidth="2" />
      <rect x="35" y="55" width="130" height="90" rx="3" fill="none" strokeWidth="1" opacity="0.3" />
      <path d="M 100 50 L 100 55" strokeWidth="2" />
      <rect x="90" y="45" width="20" height="5" rx="2" fill="none" strokeWidth="1.5" />
      <line x1="40" y1="100" x2="160" y2="100" strokeWidth="1" opacity="0.1" />
    </svg>
  );

  const renderBackpackMockup = () => (
    <svg 
      viewBox="0 0 200 240" 
      className="w-3/4 h-3/4 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <rect x="50" y="80" width="100" height="130" rx="8" strokeWidth="2" />
      <rect x="55" y="85" width="90" height="120" rx="5" fill="none" strokeWidth="1.5" opacity="0.3" />
      <path d="M 70 80 Q 70 60 85 55" fill="none" strokeWidth="3" />
      <path d="M 130 80 Q 130 60 115 55" fill="none" strokeWidth="3" />
      <rect x="70" y="50" width="60" height="30" rx="5" strokeWidth="2" />
      <circle cx="100" cy="140" r="4" fill="currentColor" opacity="0.4" />
      <rect x="60" y="100" width="80" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  );

  const renderStickerMockup = () => (
    <svg 
      viewBox="0 0 200 200" 
      className="w-1/2 h-1/2 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' }}
    >
      <path d="M 50 60 L 150 60 L 150 140 L 130 160 L 50 160 Z" strokeWidth="3" />
      <path d="M 130 160 L 130 140 L 150 140" fill="none" strokeWidth="2" opacity="0.3" />
      <circle cx="60" cy="70" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="140" cy="70" r="2" fill="currentColor" opacity="0.2" />
    </svg>
  );

  const renderKeychainMockup = () => (
    <svg 
      viewBox="0 0 200 200" 
      className="w-1/2 h-1/2 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))' }}
    >
      <circle cx="100" cy="80" r="35" strokeWidth="3" />
      <circle cx="100" cy="80" r="30" fill="none" strokeWidth="1" opacity="0.2" />
      <circle cx="100" cy="135" r="12" fill="none" strokeWidth="2.5" />
      <rect x="98" y="105" width="4" height="20" rx="2" strokeWidth="1.5" />
    </svg>
  );

  const renderWaterBottleMockup = () => (
    <svg 
      viewBox="0 0 200 240" 
      className="w-1/2 h-1/2 fill-background stroke-border"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}
    >
      <rect x="70" y="50" width="60" height="15" rx="8" strokeWidth="2" />
      <rect x="75" y="65" width="50" height="130" rx="8" strokeWidth="2.5" />
      <ellipse cx="100" cy="65" rx="25" ry="5" fill="none" strokeWidth="1" opacity="0.3" />
      <ellipse cx="100" cy="195" rx="25" ry="5" fill="none" strokeWidth="1" opacity="0.3" />
      <rect x="80" y="100" width="40" height="60" rx="5" fill="none" strokeWidth="1" opacity="0.2" />
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

  const renderPosterMockup = () => renderFramedPrintMockup();
  
  const renderHomeMockup = () => renderPillowMockup();

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
