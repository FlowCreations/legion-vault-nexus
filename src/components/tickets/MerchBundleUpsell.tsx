import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Package, ShoppingBag } from "lucide-react";
import { useTicketCartStore } from "@/stores/ticketCartStore";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MerchBundle {
  id: string;
  name: string;
  description: string | null;
  bundle_price: number;
  original_price: number;
  savings_percentage: number | null;
  items: string[];
  image_url: string | null;
  available_sizes: string[];
}

interface MerchBundleUpsellProps {
  onNext: () => void;
  onBack: () => void;
}

export function MerchBundleUpsell({ onNext, onBack }: MerchBundleUpsellProps) {
  const [merchBundles, setMerchBundles] = useState<MerchBundle[]>([]);
  const [selectedBundles, setSelectedBundles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  
  const { addBundle, removeBundle, bundles } = useTicketCartStore();

  useEffect(() => {
    loadBundles();
  }, []);

  useEffect(() => {
    // Initialize from existing cart
    const initial: Record<string, string> = {};
    bundles.forEach(b => {
      initial[b.bundleId] = b.selectedSize;
    });
    setSelectedBundles(initial);
  }, [bundles]);

  const loadBundles = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_merch_bundles')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      
      // Demo data if none exists
      if (!data || data.length === 0) {
        setMerchBundles([
          {
            id: 'show-bundle',
            name: 'Show Night Bundle',
            description: 'Everything you need for the show',
            bundle_price: 45,
            original_price: 65,
            savings_percentage: 30,
            items: ['Tour T-Shirt', 'Show Poster', 'Commemorative Wristband'],
            image_url: null,
            available_sizes: ['S', 'M', 'L', 'XL', '2XL'],
          },
          {
            id: 'vip-bundle',
            name: 'VIP Collector Bundle',
            description: 'Premium merch for true fans',
            bundle_price: 85,
            original_price: 120,
            savings_percentage: 29,
            items: ['Limited Edition Hoodie', 'Signed Photo', 'Exclusive Pin Set', 'VIP Laminate'],
            image_url: null,
            available_sizes: ['S', 'M', 'L', 'XL', '2XL'],
          },
          {
            id: 'digital-bundle',
            name: 'Digital Experience',
            description: 'Exclusive digital content',
            bundle_price: 25,
            original_price: 35,
            savings_percentage: 28,
            items: ['Live Recording Download', 'Behind-the-Scenes Video', 'Digital Photo Book'],
            image_url: null,
            available_sizes: ['One Size'],
          },
        ]);
      } else {
        setMerchBundles(data.map(b => ({
          ...b,
          items: Array.isArray(b.items) ? (b.items as string[]) : [],
          available_sizes: Array.isArray(b.available_sizes) ? (b.available_sizes as string[]) : ['S', 'M', 'L', 'XL'],
        })));
      }
    } catch (error) {
      console.error('Error loading bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBundle = (bundle: MerchBundle, size: string) => {
    if (selectedBundles[bundle.id]) {
      removeBundle(bundle.id);
      setSelectedBundles(prev => {
        const next = { ...prev };
        delete next[bundle.id];
        return next;
      });
    } else {
      addBundle({
        bundleId: bundle.id,
        name: bundle.name,
        price: bundle.bundle_price,
        selectedSize: size,
        items: bundle.items,
      });
      setSelectedBundles(prev => ({ ...prev, [bundle.id]: size }));
    }
  };

  const handleSizeChange = (bundleId: string, size: string) => {
    setSelectedBundles(prev => ({ ...prev, [bundleId]: size }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">Exclusive Show Bundles</h3>
        <p className="text-muted-foreground text-sm">Add merch to your order and save</p>
      </div>

      <div className="space-y-4">
        {merchBundles.map((bundle) => {
          const isSelected = !!selectedBundles[bundle.id];
          const currentSize = selectedBundles[bundle.id] || bundle.available_sizes[1] || bundle.available_sizes[0];
          
          return (
            <div
              key={bundle.id}
              className={`rounded-xl border-2 p-5 transition-all duration-300 ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Bundle Icon */}
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Package className="w-8 h-8" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-lg">{bundle.name}</h4>
                      {bundle.description && (
                        <p className="text-sm text-muted-foreground">{bundle.description}</p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground line-through">
                          ${bundle.original_price}
                        </span>
                        <span className="text-xl font-bold text-primary">
                          ${bundle.bundle_price}
                        </span>
                      </div>
                      {bundle.savings_percentage && (
                        <Badge className="bg-green-600 text-white">
                          Save {bundle.savings_percentage}%
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Items included */}
                  <ul className="grid grid-cols-2 gap-1 mb-4">
                    {bundle.items.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                        <Check className="w-3 h-3 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {/* Size selection & add button */}
                  <div className="flex items-center gap-3">
                    {bundle.available_sizes.length > 1 && bundle.available_sizes[0] !== 'One Size' && (
                      <Select
                        value={currentSize}
                        onValueChange={(size) => handleSizeChange(bundle.id, size)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          {bundle.available_sizes.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    <Button
                      variant={isSelected ? "secondary" : "default"}
                      className="flex-1"
                      onClick={() => toggleBundle(bundle, currentSize)}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Added
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          Add to Order
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          className="flex-1 bg-primary hover:bg-primary/90"
          onClick={onNext}
        >
          {Object.keys(selectedBundles).length > 0 ? 'Continue with Bundles' : 'Skip & Continue'}
        </Button>
      </div>
    </div>
  );
}
