import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTicketCartStore } from "@/stores/ticketCartStore";
import { supabase } from "@/integrations/supabase/client";

interface VenueSection {
  id: string;
  section_name: string;
  section_type: string;
  capacity: number;
  available: number;
  price_modifier: number;
}

interface SeatSelectionProps {
  showId: string;
  onNext: () => void;
  onBack: () => void;
}

export function SeatSelection({ showId, onNext, onBack }: SeatSelectionProps) {
  const [sections, setSections] = useState<VenueSection[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { section, setSection } = useTicketCartStore();

  useEffect(() => {
    loadSections();
  }, [showId]);

  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from('venue_sections')
        .select('*')
        .eq('show_id', showId);

      if (error) throw error;
      
      // If no sections exist, create demo data
      if (!data || data.length === 0) {
        setSections([
          { id: 'floor', section_name: 'Floor / Pit', section_type: 'pit', capacity: 200, available: 45, price_modifier: 1.25 },
          { id: 'front', section_name: 'Front Orchestra', section_type: 'seated', capacity: 150, available: 32, price_modifier: 1.15 },
          { id: 'center', section_name: 'Center Orchestra', section_type: 'seated', capacity: 200, available: 78, price_modifier: 1.0 },
          { id: 'rear', section_name: 'Rear Orchestra', section_type: 'seated', capacity: 250, available: 156, price_modifier: 0.9 },
          { id: 'balcony', section_name: 'Balcony', section_type: 'seated', capacity: 300, available: 203, price_modifier: 0.8 },
        ]);
      } else {
        setSections(data);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSection = (sec: VenueSection) => {
    setSection({
      sectionId: sec.id,
      sectionName: sec.section_name,
      priceModifier: sec.price_modifier,
    });
  };

  const getAvailabilityColor = (available: number, capacity: number) => {
    const ratio = available / capacity;
    if (ratio < 0.1) return 'bg-destructive/80 hover:bg-destructive';
    if (ratio < 0.3) return 'bg-yellow-600/80 hover:bg-yellow-600';
    return 'bg-primary/80 hover:bg-primary';
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
        <h3 className="text-xl font-bold mb-2">Select Your Section</h3>
        <p className="text-muted-foreground text-sm">Choose where you want to experience the show</p>
      </div>

      {/* Simplified Venue Map */}
      <div className="relative bg-card rounded-xl border border-border p-6">
        {/* Stage */}
        <div className="w-full h-16 bg-gradient-to-b from-primary/30 to-primary/10 rounded-t-full flex items-center justify-center mb-6">
          <span className="text-sm font-bold text-primary">STAGE</span>
        </div>

        {/* Sections Grid */}
        <div className="space-y-3">
          {sections.map((sec) => {
            const isSelected = section?.sectionId === sec.id;
            const isSoldOut = sec.available === 0;
            
            return (
              <button
                key={sec.id}
                onClick={() => !isSoldOut && handleSelectSection(sec)}
                disabled={isSoldOut}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : isSoldOut
                    ? 'border-border/50 bg-card/50 opacity-50 cursor-not-allowed'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-card-hover'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getAvailabilityColor(sec.available, sec.capacity)}`} />
                    <div>
                      <p className="font-semibold">{sec.section_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isSoldOut ? 'Sold Out' : `${sec.available} available`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {sec.price_modifier !== 1 && (
                      <Badge variant={sec.price_modifier > 1 ? "default" : "secondary"} className="text-xs">
                        {sec.price_modifier > 1 ? `+${Math.round((sec.price_modifier - 1) * 100)}%` : `${Math.round((1 - sec.price_modifier) * 100)}% off`}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-primary/80" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-yellow-600/80" />
            <span>Limited</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-destructive/80" />
            <span>Almost Gone</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          className="flex-1 bg-primary hover:bg-primary/90"
          disabled={!section}
          onClick={onNext}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
