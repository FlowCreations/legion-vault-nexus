import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useTicketCartStore } from "@/stores/ticketCartStore";
import { supabase } from "@/integrations/supabase/client";
import { VenueMap, VenueSection } from "./VenueMap";
import { SectionDetailPanel } from "./SectionDetailPanel";
import { Map, List, ChevronDown, Check, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

interface SeatSelectionProps {
  showId: string;
  onNext: () => void;
  onBack: () => void;
}

// Extended section data with more granular sections
const DEMO_SECTIONS: VenueSection[] = [
  // VIP Floor sections
  { id: 'floor', section_name: 'VIP Floor', section_type: 'pit', capacity: 200, available: 45, price_modifier: 1.5 },
  // Lower bowl - Premium (101-103)
  { id: 'front', section_name: 'Sec 101-103', section_type: 'lower-premium', capacity: 150, available: 32, price_modifier: 1.35 },
  // Lower bowl - Standard (104-108)
  { id: 'center', section_name: 'Sec 104-108', section_type: 'lower-standard', capacity: 200, available: 78, price_modifier: 1.15 },
  // Lower bowl - Value (109-113)
  { id: 'rear', section_name: 'Sec 109-113', section_type: 'lower-value', capacity: 250, available: 156, price_modifier: 0.95 },
  // Upper bowl (201-216)
  { id: 'balcony', section_name: 'Sec 201-216', section_type: 'upper', capacity: 300, available: 203, price_modifier: 0.7 },
];

type SortMode = 'price' | 'best';

export function SeatSelection({ showId, onNext, onBack }: SeatSelectionProps) {
  const [sections, setSections] = useState<VenueSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedSection, setSelectedSection] = useState<VenueSection | null>(null);
  const [ticketCount, setTicketCount] = useState(2);
  const [sortMode, setSortMode] = useState<SortMode>('price');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  
  const { section, setSection, showVenue, showDate } = useTicketCartStore();

  const basePrice = 75;

  // Calculate min/max prices from sections
  const priceStats = useMemo(() => {
    if (sections.length === 0) return { min: 0, max: 200 };
    const prices = sections.map(s => Math.round(basePrice * s.price_modifier));
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [sections]);

  // Initialize price range when sections load
  useEffect(() => {
    if (priceStats.min > 0) {
      setPriceRange([priceStats.min, priceStats.max]);
    }
  }, [priceStats]);

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
        setSections(DEMO_SECTIONS);
      } else {
        setSections(data);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
      setSections(DEMO_SECTIONS);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort sections
  const filteredSections = useMemo(() => {
    let filtered = sections.filter(sec => {
      const price = Math.round(basePrice * sec.price_modifier);
      return price >= priceRange[0] && price <= priceRange[1] && sec.available > 0;
    });

    if (sortMode === 'price') {
      filtered.sort((a, b) => a.price_modifier - b.price_modifier);
    } else {
      // Best seats = higher price modifier (closer to stage)
      filtered.sort((a, b) => b.price_modifier - a.price_modifier);
    }

    return filtered;
  }, [sections, priceRange, sortMode]);

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

  const getRowLabel = (section: VenueSection) => {
    if (section.section_type === 'pit') return 'General Admission';
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const randomRow = rows[Math.floor(Math.random() * 4)];
    const randomSeat = Math.floor(Math.random() * 20) + 1;
    return `Row ${randomRow} • Seats ${randomSeat}-${randomSeat + ticketCount - 1}`;
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
          {showVenue || 'Madison Square Garden'} • {showDate || 'Sat, Jan 18, 2025 • 8:00 PM'}
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
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Sort Tabs */}
              <div className="border-b border-border">
                <div className="flex">
                  <button
                    onClick={() => setSortMode('price')}
                    className={cn(
                      "flex-1 px-4 py-3 text-sm font-semibold text-center border-b-2 transition-colors",
                      sortMode === 'price'
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    LOWEST PRICE
                  </button>
                  <button
                    onClick={() => setSortMode('best')}
                    className={cn(
                      "flex-1 px-4 py-3 text-sm font-semibold text-center border-b-2 transition-colors",
                      sortMode === 'best'
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    BEST SEATS
                  </button>
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Price Range</span>
                  <span className="text-sm text-muted-foreground">
                    ${priceRange[0]} - ${priceRange[1]}
                  </span>
                </div>
                <Slider
                  value={priceRange}
                  min={priceStats.min}
                  max={priceStats.max}
                  step={5}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  className="w-full"
                />
              </div>

              {/* We're All In Notice */}
              <div className="px-4 py-2 bg-emerald-500/10 border-b border-border">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    We're All In: Prices include fees
                  </span>
                </div>
              </div>

              {/* Section Listings */}
              <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                {filteredSections.map((sec) => {
                  const isSelected = selectedSection?.id === sec.id;
                  const price = Math.round(basePrice * sec.price_modifier);
                  const isResale = Math.random() > 0.5; // Demo: random resale flag
                  
                  return (
                    <button
                      key={sec.id}
                      onClick={() => handleSelectSection(sec)}
                      className={cn(
                        "w-full p-4 text-left transition-all duration-200 flex items-start gap-3",
                        isSelected && "bg-primary/10",
                        "hover:bg-muted/50"
                      )}
                    >
                      {/* Section Thumbnail */}
                      <div className="w-16 h-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0 border border-border">
                        <Eye className="w-5 h-5 text-muted-foreground" />
                      </div>

                      {/* Section Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm">{sec.section_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {getRowLabel(sec)}
                            </p>
                            {isResale && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium rounded">
                                Verified Resale Ticket
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-base">${price}</p>
                            <p className="text-[10px] text-muted-foreground">each</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {filteredSections.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No sections available in this price range</p>
                    <p className="text-sm mt-1">Try adjusting the price filter</p>
                  </div>
                )}
              </div>
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
