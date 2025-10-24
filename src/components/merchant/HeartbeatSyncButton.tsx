import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Heart, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const HeartbeatSyncButton = () => {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('heartbeat-sync', {
        body: { action: 'sync_to_database' }
      });
      
      if (error) throw error;
      
      console.log('Heartbeat sync result:', data);
      toast.success(`Synced ${data.synced} members from Heartbeat!`);
    } catch (error) {
      console.error('Error syncing Heartbeat members:', error);
      toast.error('Failed to sync Heartbeat members');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {loading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <Heart className="w-4 h-4" />
      )}
      {loading ? 'Syncing...' : 'Sync Heartbeat Members'}
    </Button>
  );
};
