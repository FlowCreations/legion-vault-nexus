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
      
      // Add 5 members at once
      const promises = Array(5).fill(null).map(() => 
        supabase.functions.invoke('seed-member-coordinates')
      );
      
      const results = await Promise.all(promises);
      const totalGeocoded = results.reduce((sum, { data }) => sum + (data?.geocoded || 0), 0);
      
      if (results.some(r => r.error)) {
        throw new Error('Some members failed to add');
      }
      
      toast.success(`Successfully added ${totalGeocoded} new members to the map!`);
      setNeedsGeocoding(false);
    } catch (error) {
      console.error('Error adding members:', error);
      toast.error('Failed to add new members');
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
          {isGeocoding ? "Adding members..." : "Add 5 Random Members"}
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
