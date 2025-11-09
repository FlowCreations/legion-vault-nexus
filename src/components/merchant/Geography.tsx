import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GlobeRealtime } from "./GlobeRealtime";

export const Geography = () => {
  const [needsGeocoding, setNeedsGeocoding] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [shouldLoadGlobe, setShouldLoadGlobe] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const checkGeocoding = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .not('location', 'is', null)
        .is('latitude', null);
      
      if (error) {
        console.error('Error checking geocoding:', error);
        return;
      }
      
      const count = data?.length || 0;
      setMemberCount(count);
      setNeedsGeocoding(count > 0);
    } catch (error) {
      console.error('Error in checkGeocoding:', error);
    }
  }, []);

  const handleGeocode = async () => {
    try {
      setIsGeocoding(true);
      const { data, error } = await supabase.functions.invoke('seed-member-coordinates');
      
      if (error) throw error;
      
      toast.success(`Successfully geocoded ${data.geocoded} member locations!`);
      setNeedsGeocoding(false);
    } catch (error) {
      console.error('Error geocoding:', error);
      toast.error('Failed to geocode member locations');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Intersection Observer to only load globe when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoadGlobe(true);
          observer.disconnect(); // Only load once
        }
      },
      { rootMargin: '200px' } // Start loading 200px before visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Global Reach</h2>
        {needsGeocoding && (
          <Button 
            onClick={handleGeocode}
            disabled={isGeocoding}
            variant="outline"
            className="gap-2"
          >
            <MapPin className="h-4 w-4" />
            {isGeocoding 
              ? `Populating ${memberCount} locations...` 
              : `Populate Map (${memberCount} members)`}
          </Button>
        )}
      </div>
      {shouldLoadGlobe ? (
        <GlobeRealtime />
      ) : (
        <div className="w-full h-[600px] rounded-lg border border-border bg-muted/20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading globe...</p>
          </div>
        </div>
      )}
    </div>
  );
};
