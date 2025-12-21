import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, MapPin, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface VenueSection {
  id: string;
  section_name: string;
  section_type: string;
  capacity: number;
  available: number;
  price_modifier: number;
}

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

  const getAvailabilityLabel = () => {
    const ratio = section.available / section.capacity;
    if (ratio < 0.1) return { text: "Almost Gone", color: "text-destructive" };
    if (ratio < 0.3) return { text: "Limited", color: "text-yellow-500" };
    return { text: "Available", color: "text-emerald-500" };
  };

  const availability = getAvailabilityLabel();

  // Generate row options based on section type
  const getRowLabel = () => {
    if (section.section_type === 'pit') return "General Admission";
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    const randomRow = rows[Math.floor(Math.random() * Math.min(3, rows.length))];
    return `Row ${randomRow}`;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5 animate-in slide-in-from-right-5 duration-300">
      {/* Section Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg">{section.section_name}</h3>
            <p className="text-sm text-muted-foreground">{getRowLabel()}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className={cn("text-sm font-medium", availability.color)}>
            {availability.text} · {section.available} seats
          </span>
        </div>
      </div>

      {/* View from Section (placeholder) */}
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border border-border">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
          <Eye className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-sm">View from {section.section_name}</span>
        </div>
      </div>

      {/* Price & Quantity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Price per ticket</span>
          <span className="font-bold text-lg">${pricePerTicket}</span>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Tickets</span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onTicketCountChange(Math.max(1, ticketCount - 1))}
              disabled={ticketCount <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="font-bold text-lg w-6 text-center">{ticketCount}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onTicketCountChange(Math.min(maxTickets, ticketCount + 1))}
              disabled={ticketCount >= maxTickets}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Ticket Info */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
          You'll get <span className="text-foreground font-medium">{ticketCount} ticket{ticketCount > 1 ? 's' : ''}</span> together in {section.section_name}
        </div>

        {/* Subtotal */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="font-medium">Subtotal</span>
          <span className="font-bold text-xl">${subtotal}</span>
        </div>
      </div>

      {/* Continue Button */}
      <Button
        className="w-full h-12 text-base font-semibold"
        onClick={onContinue}
      >
        Continue to Tickets
      </Button>
    </div>
  );
}
