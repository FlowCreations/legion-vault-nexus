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
      console.log('Starting Heartbeat sync...');
      
      const { data, error } = await supabase.functions.invoke('heartbeat-sync', {
        body: { action: 'sync_to_database' }
      });
      
      if (error) {
        console.error('Sync error:', error);
        throw error;
      }
      
      console.log('Heartbeat sync result:', data);
      
      const createdCount = data?.synced || 0;
      const updatedCount = data?.updated || 0;
      const totalCount = data?.total || 0;
      const errorCount = data?.errors?.length || 0;
      
      if (errorCount > 0) {
        console.warn('Sync errors:', data.errors);
        toast.warning(
          `Synced ${createdCount + updatedCount} of ${totalCount} members. ${errorCount} errors encountered.`,
          { duration: 5000 }
        );
      } else {
        toast.success(
          `Successfully synced ${totalCount} members! (${createdCount} new, ${updatedCount} updated)`,
          { duration: 5000 }
        );
      }
      
      // Wait a moment then reload to show updated members
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error('Error syncing Heartbeat members:', error);
      toast.error(error?.message || 'Failed to sync Heartbeat members');
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
