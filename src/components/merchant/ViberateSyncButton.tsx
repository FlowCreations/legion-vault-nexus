import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ViberateSyncButton = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-viberate', {
        body: { artist_id: 'sons-of-legion' }
      });

      if (error) throw error;

      setLastSync(data.synced_at);
      toast.success('Viberate data synced successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync Viberate data');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleSync}
        disabled={syncing}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
        Sync Viberate
      </Button>
      {lastSync && (
        <span className="text-xs text-muted-foreground">
          Last synced: {new Date(lastSync).toLocaleString()}
        </span>
      )}
    </div>
  );
};