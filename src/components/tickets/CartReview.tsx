import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trash2, Ticket, Package, Info, Lock } from "lucide-react";
import { useTicketCartStore } from "@/stores/ticketCartStore";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CartReviewProps {
  onNext: () => void;
  onBack: () => void;
}

export function CartReview({ onNext, onBack }: CartReviewProps) {
  const [processing, setProcessing] = useState(false);
  
  const { toast } = useToast();
  
  const {
    showVenue,
    showDate,
    showCity,
    tickets,
    section,
    bundles,
    ticketSubtotal,
    bundleSubtotal,
    ticketmasterFees,
    portalConvenienceFee,
    total,
    customerEmail,
    customerName,
    removeTicket,
    removeBundle,
    setCustomerInfo,
    setOrderConfirmed,
  } = useTicketCartStore();

  const handleCheckout = async () => {
    if (!customerEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email to continue",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    
    try {
      // Generate order number
      const orderNumber = `SOL-${Date.now().toString(36).toUpperCase()}`;
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create order record
      const { error } = await supabase.from('ticket_orders').insert([{
        user_id: user?.id || null,
        order_number: orderNumber,
        status: 'confirmed',
        tickets: tickets as any,
        bundles: bundles as any,
        subtotal: ticketSubtotal + bundleSubtotal,
        ticketmaster_fees: ticketmasterFees,
        portal_convenience_fee: portalConvenienceFee,
        total: total,
        customer_email: customerEmail,
        customer_name: customerName,
      }]);

      if (error) {
        console.error('Order creation error:', error);
        // For demo, continue anyway
      }
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setOrderConfirmed(orderNumber);
      onNext();
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const totalTicketCount = tickets.reduce((sum, t) => sum + t.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">Review Your Order</h3>
        <p className="text-muted-foreground text-sm">
          {showVenue} • {showCity} • {formatDate(showDate)}
        </p>
      </div>

      {/* Tickets */}
      <div className="space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <Ticket className="w-4 h-4" />
          Tickets ({totalTicketCount})
        </h4>
        
        {tickets.map((ticket) => (
          <div key={ticket.ticketTypeId} className="flex items-center justify-between bg-card rounded-lg p-4 border border-border">
            <div>
              <p className="font-medium">{ticket.name}</p>
              <p className="text-sm text-muted-foreground">
                {ticket.quantity} × ${ticket.price.toFixed(2)}
                {section && section.priceModifier !== 1 && (
                  <span className="ml-2">({section.sectionName})</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-bold">
                ${(ticket.price * ticket.quantity * (section?.priceModifier || 1)).toFixed(2)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => removeTicket(ticket.ticketTypeId)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Bundles */}
      {bundles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Package className="w-4 h-4" />
            Merch Bundles
          </h4>
          
          {bundles.map((bundle) => (
            <div key={bundle.bundleId} className="flex items-center justify-between bg-card rounded-lg p-4 border border-border">
              <div>
                <p className="font-medium">{bundle.name}</p>
                <p className="text-sm text-muted-foreground">
                  Size: {bundle.selectedSize}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bold">${bundle.price.toFixed(2)}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeBundle(bundle.bundleId)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Separator />

      {/* Fee Breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ticket Subtotal</span>
          <span>${ticketSubtotal.toFixed(2)}</span>
        </div>
        
        {bundleSubtotal > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Merch Subtotal</span>
            <span>${bundleSubtotal.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1">
            Service Fee
            <Info className="w-3 h-3" />
          </span>
          <span>${ticketmasterFees.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1">
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              Portal
            </Badge>
            Convenience Fee
            <span className="text-xs">($2.50/ticket)</span>
          </span>
          <span className="text-primary font-medium">${portalConvenienceFee.toFixed(2)}</span>
        </div>
        
        <Separator />
        
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <Separator />

      {/* Customer Info */}
      <div className="space-y-4">
        <h4 className="font-semibold">Your Information</h4>
        
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={customerEmail}
              onChange={(e) => setCustomerInfo(e.target.value, customerName)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Your tickets will be sent to this email
            </p>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={customerName}
              onChange={(e) => setCustomerInfo(customerEmail, e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={processing}>
          Back
        </Button>
        <Button
          className="flex-1 bg-primary hover:bg-primary/90 h-12"
          onClick={handleCheckout}
          disabled={tickets.length === 0 || processing}
        >
          {processing ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Processing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Complete Purchase
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
