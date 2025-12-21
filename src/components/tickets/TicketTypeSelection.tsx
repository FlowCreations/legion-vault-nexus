import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Star, Crown, Ticket } from "lucide-react";
import { useTicketCartStore } from "@/stores/ticketCartStore";
import { supabase } from "@/integrations/supabase/client";

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  available_quantity: number;
  max_per_order: number;
  perks: string[];
}

interface TicketTypeSelectionProps {
  showId: string;
  onNext: () => void;
  onBack?: () => void;
}

export function TicketTypeSelection({ showId, onNext, onBack }: TicketTypeSelectionProps) {
  const { section } = useTicketCartStore();
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  
  const { addTicket, tickets } = useTicketCartStore();

  useEffect(() => {
    loadTicketTypes();
  }, [showId]);

  useEffect(() => {
    // Initialize quantities from existing cart
    const initial: Record<string, number> = {};
    tickets.forEach(t => {
      initial[t.ticketTypeId] = t.quantity;
    });
    setQuantities(initial);
  }, [tickets]);

  const loadTicketTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('show_id', showId)
        .order('tier_order', { ascending: true });

      if (error) throw error;
      
      // If no ticket types exist, create demo data
      if (!data || data.length === 0) {
        setTicketTypes([
          {
            id: 'ga-demo',
            name: 'General Admission',
            description: 'Standing room with full venue access',
            price: 65,
            available_quantity: 500,
            max_per_order: 8,
            perks: ['Standing room access', 'Cash bar access'],
          },
          {
            id: 'vip-demo',
            name: 'VIP Experience',
            description: 'Premium viewing with exclusive perks',
            price: 150,
            available_quantity: 100,
            max_per_order: 4,
            perks: ['Reserved seating', 'Meet & greet', 'Exclusive merch item', 'Priority entry'],
          },
          {
            id: 'platinum-demo',
            name: 'Platinum Package',
            description: 'Ultimate fan experience',
            price: 350,
            available_quantity: 25,
            max_per_order: 2,
            perks: ['Front row access', 'Backstage tour', 'Signed merchandise', 'Photo opportunity', 'Dinner with the band'],
          },
        ]);
      } else {
        setTicketTypes(data.map(t => ({
          ...t,
          perks: Array.isArray(t.perks) ? (t.perks as string[]) : [],
        })));
      }
    } catch (error) {
      console.error('Error loading ticket types:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (ticketId: string, delta: number) => {
    const ticketType = ticketTypes.find(t => t.id === ticketId);
    if (!ticketType) return;

    const current = quantities[ticketId] || 0;
    const newQty = Math.max(0, Math.min(ticketType.max_per_order, current + delta));
    
    setQuantities(prev => ({ ...prev, [ticketId]: newQty }));
  };

  const handleContinue = () => {
    // Add all selected tickets to cart
    Object.entries(quantities).forEach(([ticketId, qty]) => {
      if (qty > 0) {
        const ticketType = ticketTypes.find(t => t.id === ticketId);
        if (ticketType) {
          // Clear existing and add fresh
          addTicket({
            ticketTypeId: ticketId,
            name: ticketType.name,
            price: ticketType.price,
            quantity: qty,
            perks: ticketType.perks,
          });
        }
      }
    });
    onNext();
  };

  const getTierIcon = (name: string) => {
    if (name.toLowerCase().includes('platinum')) return <Crown className="w-5 h-5" />;
    if (name.toLowerCase().includes('vip')) return <Star className="w-5 h-5" />;
    return <Ticket className="w-5 h-5" />;
  };

  const getTierStyle = (name: string) => {
    if (name.toLowerCase().includes('platinum')) {
      return 'border-amber-500/50 bg-gradient-to-br from-amber-950/30 to-background';
    }
    if (name.toLowerCase().includes('vip')) {
      return 'border-purple-500/50 bg-gradient-to-br from-purple-950/30 to-background';
    }
    return 'border-border bg-card';
  };

  const totalSelected = Object.values(quantities).reduce((sum, q) => sum + q, 0);

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
        <h3 className="text-xl font-bold mb-2">Select Your Tickets</h3>
        <p className="text-muted-foreground text-sm">Choose your experience level</p>
      </div>

      <div className="space-y-4">
        {ticketTypes.map((ticket) => {
          const qty = quantities[ticket.id] || 0;
          const isSelected = qty > 0;
          
          return (
            <div
              key={ticket.id}
              className={`rounded-xl border-2 p-5 transition-all duration-300 ${getTierStyle(ticket.name)} ${
                isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getTierIcon(ticket.name)}
                    <h4 className="font-bold text-lg">{ticket.name}</h4>
                    {ticket.available_quantity < 50 && (
                      <Badge variant="destructive" className="text-xs">
                        Only {ticket.available_quantity} left
                      </Badge>
                    )}
                  </div>
                  
                  {ticket.description && (
                    <p className="text-sm text-muted-foreground mb-3">{ticket.description}</p>
                  )}
                  
                  {ticket.perks.length > 0 && (
                    <ul className="space-y-1">
                      {ticket.perks.map((perk, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold mb-3">
                    ${section ? Math.round(ticket.price * section.priceModifier) : ticket.price}
                  </p>
                  
                  <div className="flex items-center gap-2 bg-background/50 rounded-lg p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(ticket.id, -1)}
                      disabled={qty === 0}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-bold">{qty}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(ticket.id, 1)}
                      disabled={qty >= ticket.max_per_order}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    Max {ticket.max_per_order} per order
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
        )}
        <Button
          className="flex-1 bg-primary hover:bg-primary/90 h-12"
          disabled={totalSelected === 0}
          onClick={handleContinue}
        >
          Continue with {totalSelected} ticket{totalSelected !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
}
