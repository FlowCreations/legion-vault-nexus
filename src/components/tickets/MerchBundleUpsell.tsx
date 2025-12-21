import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Plus } from "lucide-react";
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

  const { tickets } = useTicketCartStore();
  const totalTickets = tickets.reduce((sum, t) => sum + t.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Friendly contextual header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">Before you checkout...</h3>
        <p className="text-muted-foreground text-sm">
          You're getting {totalTickets} ticket{totalTickets !== 1 ? 's' : ''}. 
          Want to add some exclusive merch?
        </p>
      </div>

      {/* Simplified bundle cards */}
      <div className="space-y-3">
        {merchBundles.map((bundle) => {
          const isSelected = !!selectedBundles[bundle.id];
          const currentSize = selectedBundles[bundle.id] || bundle.available_sizes[1] || bundle.available_sizes[0];
          
          return (
            <div
              key={bundle.id}
              className={`rounded-lg border p-4 transition-all duration-200 ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold truncate">{bundle.name}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Save ${bundle.original_price - bundle.bundle_price}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {bundle.items.slice(0, 2).join(', ')}
                    {bundle.items.length > 2 && ` +${bundle.items.length - 2} more`}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Size selector - compact */}
                  {bundle.available_sizes.length > 1 && bundle.available_sizes[0] !== 'One Size' && (
                    <select
                      value={currentSize}
                      onChange={(e) => handleSizeChange(bundle.id, e.target.value)}
                      className="text-xs bg-background border border-border rounded px-2 py-1"
                    >
                      {bundle.available_sizes.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  )}
                  
                  <span className="font-bold text-lg">${bundle.bundle_price}</span>
                  
                  <button
                    onClick={() => toggleBundle(bundle, currentSize)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted hover:bg-primary/20'
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
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
          {Object.keys(selectedBundles).length > 0 ? 'Review Order' : 'No Thanks, Continue'}
        </Button>
      </div>
    </div>
  );
}
