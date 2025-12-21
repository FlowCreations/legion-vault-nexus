import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTicketCartStore } from "@/stores/ticketCartStore";
import { supabase } from "@/integrations/supabase/client";
import { VenueMap } from "./VenueMap";
import { SectionDetailPanel } from "./SectionDetailPanel";
import { Map, List, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedSection, setSelectedSection] = useState<VenueSection | null>(null);
  const [ticketCount, setTicketCount] = useState(2);
  
  const { section, setSection, showVenue, showDate } = useTicketCartStore();

  const basePrice = 75; // Base ticket price

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
      
      if (!data || data.length === 0) {
        setSections([
          { id: 'floor', section_name: 'Floor / GA Pit', section_type: 'pit', capacity: 200, available: 45, price_modifier: 1.5 },
          { id: 'front', section_name: 'Sec 101-103', section_type: 'seated', capacity: 150, available: 32, price_modifier: 1.25 },
          { id: 'center', section_name: 'Sec 104-108', section_type: 'seated', capacity: 200, available: 78, price_modifier: 1.0 },
          { id: 'rear', section_name: 'Sec 109-115', section_type: 'seated', capacity: 250, available: 156, price_modifier: 0.85 },
          { id: 'balcony', section_name: 'Sec 201-210', section_type: 'seated', capacity: 300, available: 203, price_modifier: 0.7 },
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
    setSelectedSection(sec);
    setSection({
      sectionId: sec.id,
      sectionName: sec.section_name,
      priceModifier: sec.price_modifier,
    });
  };

  const handleContinue = () => {
    if (selectedSection) {
      onNext();
    }
  };

  const getAvailabilityColor = (available: number, capacity: number) => {
    const ratio = available / capacity;
    if (ratio < 0.1) return 'bg-destructive/60';
    if (ratio < 0.3) return 'bg-yellow-500/60';
    return 'bg-emerald-500/60';
  };

  const getAvailabilityText = (available: number, capacity: number) => {
    const ratio = available / capacity;
    if (ratio < 0.1) return 'Almost Gone';
    if (ratio < 0.3) return 'Limited';
    return 'Available';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Event Info */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <h3 className="font-bold text-lg">Select Your Seats</h3>
        <p className="text-sm text-muted-foreground">
          {showVenue || 'Venue'} • {showDate || 'Date TBD'}
        </p>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Ticket Count Dropdown */}
        <div className="relative">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
            <span className="font-medium">{ticketCount} Ticket{ticketCount > 1 ? 's' : ''}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-card border border-border rounded-lg p-1">
          <button
            onClick={() => setViewMode('map')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === 'map' 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Map className="w-4 h-4" />
            Map
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === 'list' 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="w-4 h-4" />
            List
          </button>
        </div>
      </div>

      {/* Main Content - Map or List with Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Map/List View */}
        <div className={cn(
          "transition-all duration-300",
          selectedSection ? "lg:col-span-3" : "lg:col-span-5"
        )}>
          {viewMode === 'map' ? (
            <VenueMap
              sections={sections}
              selectedSectionId={selectedSection?.id || null}
              onSelectSection={handleSelectSection}
            />
          ) : (
            <div className="bg-card rounded-xl border border-border divide-y divide-border max-h-[400px] overflow-y-auto">
              {sections.map((sec) => {
                const isSelected = selectedSection?.id === sec.id;
                const isSoldOut = sec.available === 0;
                const price = Math.round(basePrice * sec.price_modifier);
                
                return (
                  <button
                    key={sec.id}
                    onClick={() => !isSoldOut && handleSelectSection(sec)}
                    disabled={isSoldOut}
                    className={cn(
                      "w-full p-4 text-left transition-all duration-200 flex items-center justify-between",
                      isSelected && "bg-primary/10",
                      isSoldOut ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        isSoldOut ? "bg-muted" : getAvailabilityColor(sec.available, sec.capacity)
                      )} />
                      <div>
                        <p className="font-semibold">{sec.section_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {isSoldOut ? 'Sold Out' : `${getAvailabilityText(sec.available, sec.capacity)} · ${sec.available} seats`}
                        </p>
                      </div>
                    </div>
                    {!isSoldOut && (
                      <div className="text-right">
                        <p className="font-bold">${price}</p>
                        <p className="text-xs text-muted-foreground">each</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Section Detail Panel */}
        {selectedSection && (
          <div className="lg:col-span-2">
            <SectionDetailPanel
              section={selectedSection}
              basePrice={basePrice}
              ticketCount={ticketCount}
              onTicketCountChange={setTicketCount}
              onContinue={handleContinue}
              onClose={() => setSelectedSection(null)}
            />
          </div>
        )}
      </div>

      {/* Mobile Continue Button (when no detail panel) */}
      {!selectedSection && (
        <p className="text-center text-muted-foreground text-sm py-4">
          Select a section on the map to continue
        </p>
      )}
    </div>
  );
}
