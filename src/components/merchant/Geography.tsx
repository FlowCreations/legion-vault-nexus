import { useState, useCallback } from "react";
import { GlobeRealtime } from "./GlobeRealtime";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Geography = () => {
  const [needsGeocoding, setNeedsGeocoding] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Don't auto-check on mount - only when user requests it
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
      setRefreshKey(prev => prev + 1); // Trigger refresh
      setNeedsGeocoding(false);
    } catch (error) {
      console.error('Error geocoding:', error);
      toast.error('Failed to geocode member locations');
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Global Reach</h2>
        {needsGeocoding && (
          <Button 
            onClick={handleGeocode}
            disabled={isGeocoding}
            className="bg-gradient-gold"
          >
            {isGeocoding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Geocoding {memberCount} Members...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Populate Map ({memberCount} members)
              </>
            )}
          </Button>
        )}
      </div>
      <GlobeRealtime />
    </div>
  );
};
