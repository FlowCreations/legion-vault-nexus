import { Button } from "@/components/ui/button";
import { Minus, Plus, Eye, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { VenueSection } from "./VenueMap";

interface SectionDetailPanelProps {
  section: VenueSection;
  basePrice: number;
  ticketCount: number;
  onTicketCountChange: (count: number) => void;
  onContinue: () => void;
  onClose: () => void;
}

export function SectionDetailPanel({
  section,
  basePrice,
  ticketCount,
  onTicketCountChange,
  onContinue,
  onClose,
}: SectionDetailPanelProps) {
  const pricePerTicket = Math.round(basePrice * section.price_modifier);
  const subtotal = pricePerTicket * ticketCount;
  const maxTickets = Math.min(section.available, 8);

  // Generate row based on section type
  const getRowInfo = () => {
    if (section.section_type === 'pit') {
      return { row: 'GA', seats: 'Standing' };
    }
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];
    const randomRow = rows[Math.floor(Math.random() * 5)];
    const startSeat = Math.floor(Math.random() * 20) + 1;
    return { 
      row: randomRow, 
      seats: `${startSeat}-${startSeat + ticketCount - 1}` 
    };
  };

  const rowInfo = getRowInfo();

  // Parse section name for display
  const formatSectionName = () => {
    if (section.section_name.startsWith('Sec ')) {
      return section.section_name;
    }
    if (section.section_name.includes('VIP')) {
      return section.section_name;
    }
    return `Sec ${section.section_name}`;
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden animate-in slide-in-from-right-5 duration-300">
      {/* Section Header - Ticketmaster style */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg">{formatSectionName()}</h3>
            <p className="text-sm text-muted-foreground">
              Row {rowInfo.row} • Seats {rowInfo.seats}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none p-1"
          >
            ×
          </button>
        </div>
      </div>

      {/* View from Section */}
      <div className="relative aspect-video bg-gradient-to-b from-muted/50 to-muted border-b border-border">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
          <Eye className="w-10 h-10 mb-2 opacity-40" />
          <span className="text-sm font-medium">View from {formatSectionName()}</span>
          <span className="text-xs mt-1 opacity-60">Row {rowInfo.row}</span>
        </div>
        {/* Stage indicator */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary/20 rounded-full">
          <span className="text-[10px] font-semibold text-primary">STAGE</span>
        </div>
      </div>

      {/* Ticket Details */}
      <div className="p-4 space-y-4">
        {/* Verified Badge */}
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-sm font-medium">Verified Ticket</span>
        </div>

        {/* Price Display */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Price per ticket</span>
          <span className="font-bold text-xl">${pricePerTicket}</span>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Quantity</span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => onTicketCountChange(Math.max(1, ticketCount - 1))}
              disabled={ticketCount <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="font-bold text-lg w-8 text-center">{ticketCount}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => onTicketCountChange(Math.min(maxTickets, ticketCount + 1))}
              disabled={ticketCount >= maxTickets}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Ticket Summary */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>{ticketCount} × ${pricePerTicket}</span>
            <span>Includes fees</span>
          </div>
        </div>

        {/* Subtotal */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="font-semibold">Total</span>
          <span className="font-bold text-2xl">${subtotal}</span>
        </div>
      </div>

      {/* Continue Button */}
      <div className="p-4 pt-0">
        <Button
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
