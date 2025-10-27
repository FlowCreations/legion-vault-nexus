import { Button } from "@/components/ui/button";
import { Loader2, Database } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const TunepipeSyncButton = ({ onSyncComplete }: { onSyncComplete?: () => void }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-tunepipe-data', {
        body: { action: 'sync_all' }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(
          `Tunepipe data synced! ${data.synced.campaigns} campaigns, ${data.synced.subscribers} subscribers, ${data.synced.analytics_events} events`,
          { duration: 5000 }
        );
        onSyncComplete?.();
      } else {
        toast.error(`Sync completed with errors: ${data.errors.join(', ')}`);
      }
    } catch (error: any) {
      console.error('Tunepipe sync error:', error);
      toast.error(`Failed to sync Tunepipe data: ${error.message}`);
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
      {isSyncing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Syncing Tunepipe...
        </>
      ) : (
        <>
          <Database className="h-4 w-4" />
          Sync Tunepipe Data
        </>
      )}
    </Button>
  );
};
