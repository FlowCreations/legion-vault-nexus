import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const SeedCoordinatesButton = () => {
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('seed-member-coordinates');
      
      if (error) throw error;
      
      console.log('Seed result:', data);
      toast.success(`Geocoded ${data.geocoded} member locations!`);
    } catch (error) {
      console.error('Error seeding coordinates:', error);
      toast.error('Failed to geocode member locations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSeed} 
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <MapPin className="w-4 h-4" />
      {loading ? 'Geocoding...' : 'Seed Member Locations'}
    </Button>
  );
};