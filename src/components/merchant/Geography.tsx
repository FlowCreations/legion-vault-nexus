import { useState, useCallback, lazy, Suspense, memo } from "react";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const GlobalReachMap = lazy(() => import("./GlobalReachMap"));

export const Geography = () => {
  const [needsGeocoding, setNeedsGeocoding] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  // Removed geocoding check - not needed for initial load performance

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Global Reach</h2>
        <Button 
          onClick={handleGeocode}
          disabled={isGeocoding}
          variant="outline"
          className="gap-2"
        >
          <MapPin className="h-4 w-4" />
          {isGeocoding ? "Adding member..." : "Add Random Member"}
        </Button>
      </div>
      <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-lg" />}>
        <GlobalReachMap 
          membersEndpoint="members-geojson"
          autoFit={true}
          padding={60}
          title=""
        />
      </Suspense>
    </div>
  );
};

export default memo(Geography);
