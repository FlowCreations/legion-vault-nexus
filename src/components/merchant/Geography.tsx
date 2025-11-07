import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

export const Geography = () => {
  const [needsGeocoding, setNeedsGeocoding] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

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

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold">Global Reach</h3>
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
      <p className="text-muted-foreground">
        View your global community on the interactive map in the Community tab.
      </p>
    </Card>
  );
};
