import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  Download, 
  Calendar, 
  Mail, 
  Share2,
  Music,
  ShoppingBag
} from "lucide-react";
import { useTicketCartStore } from "@/stores/ticketCartStore";

interface TicketConfirmationProps {
  onClose: () => void;
}

export function TicketConfirmation({ onClose }: TicketConfirmationProps) {
  const {
    orderNumber,
    showVenue,
    showDate,
    showCity,
    tickets,
    bundles,
    total,
    customerEmail,
    resetCart,
  } = useTicketCartStore();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleClose = () => {
    resetCart();
    onClose();
  };

  const totalTicketCount = tickets.reduce((sum, t) => sum + t.quantity, 0);

  return (
    <div className="space-y-6 text-center">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-2">You're Going!</h3>
        <p className="text-muted-foreground">
          Your tickets have been confirmed
        </p>
      </div>

      {/* Order Number */}
      <div className="bg-card rounded-xl border border-border p-4">
        <p className="text-sm text-muted-foreground mb-1">Order Number</p>
        <p className="text-xl font-mono font-bold text-primary">{orderNumber}</p>
      </div>

      {/* Event Details */}
      <div className="bg-card rounded-xl border border-border p-5 text-left">
        <h4 className="font-bold text-lg mb-3">{showVenue}</h4>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">{showCity}</p>
          <p className="font-medium">{formatDate(showDate)}</p>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <div key={ticket.ticketTypeId} className="flex justify-between text-sm">
              <span>{ticket.quantity}× {ticket.name}</span>
            </div>
          ))}
          {bundles.map((bundle) => (
            <div key={bundle.bundleId} className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" />
                {bundle.name}
              </span>
              <Badge variant="secondary" className="text-xs">{bundle.selectedSize}</Badge>
            </div>
          ))}
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex justify-between font-bold">
          <span>Total Paid</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Confirmation Email */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        <Mail className="w-4 h-4" />
        <span>Confirmation sent to <strong>{customerEmail}</strong></span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download Tickets
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Add to Calendar
        </Button>
      </div>

      <Separator />

      {/* Post-Purchase Upsells */}
      <div className="space-y-4">
        <p className="text-sm font-medium">While you wait for the show...</p>
        
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-card hover:bg-card-hover border border-border rounded-lg p-4 text-left transition-colors">
            <Music className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium text-sm">Pre-Show Playlist</p>
            <p className="text-xs text-muted-foreground">Get hyped with our setlist</p>
          </button>
          
          <button className="bg-card hover:bg-card-hover border border-border rounded-lg p-4 text-left transition-colors">
            <ShoppingBag className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium text-sm">Skip the Line</p>
            <p className="text-xs text-muted-foreground">Pre-order merch pickup</p>
          </button>
        </div>
      </div>

      <Button 
        className="w-full bg-primary hover:bg-primary/90"
        onClick={handleClose}
      >
        Done
      </Button>

      <Button 
        variant="ghost" 
        className="flex items-center gap-2 mx-auto"
        onClick={() => {
          navigator.share?.({
            title: `I'm going to ${showVenue}!`,
            text: `Just got tickets to see Sons of Legion at ${showVenue}!`,
          });
        }}
      >
        <Share2 className="w-4 h-4" />
        Share with friends
      </Button>
    </div>
  );
}
