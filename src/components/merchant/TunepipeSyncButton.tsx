import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const TunepipeSyncButton = ({ onSyncComplete }: { onSyncComplete?: () => void }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      console.log("Starting Tunepipe data sync via edge function...");
      
      const { data, error } = await supabase.functions.invoke('sync-tunepipe-data', {
        body: { action: 'sync_all' },
      });

      if (error) throw error;

      console.log("Sync completed:", data);
      
      if (data.success) {
        toast.success("Tunepipe data synced successfully!", {
          description: `Synced ${data.synced.campaigns} campaigns, ${data.synced.subscribers} subscribers, and ${data.synced.analytics_events} analytics events.`,
        });
        
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        toast.error("Sync completed with errors", {
          description: data.errors.join(", "),
        });
      }
    } catch (error: any) {
      console.error("Tunepipe sync error:", error);
      toast.error("Failed to sync Tunepipe data", {
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant="outline"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Syncing..." : "Sync Tunepipe Data"}
    </Button>
  );
};
