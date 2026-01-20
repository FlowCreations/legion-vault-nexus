import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Heart, RefreshCw, Megaphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const HeartbeatSyncButton = () => {
  const [loading, setLoading] = useState(false);
  const [syncingAnnouncements, setSyncingAnnouncements] = useState(false);

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

  const handleSyncAnnouncements = async () => {
    try {
      setSyncingAnnouncements(true);
      console.log('Starting Heartbeat announcements sync...');
      
      const { data, error } = await supabase.functions.invoke('heartbeat-sync', {
        body: { action: 'sync_announcements' }
      });
      
      if (error) {
        console.error('Announcements sync error:', error);
        throw error;
      }
      
      console.log('Announcements sync result:', data);
      
      if (!data?.success) {
        toast.error(data?.error || 'Failed to sync announcements');
        return;
      }
      
      const createdCount = data?.synced || 0;
      const updatedCount = data?.updated || 0;
      const totalCount = data?.total || 0;
      const errorCount = data?.errors?.length || 0;
      
      if (errorCount > 0) {
        console.warn('Sync errors:', data.errors);
        toast.warning(
          `Synced ${createdCount + updatedCount} of ${totalCount} announcements. ${errorCount} errors encountered.`,
          { duration: 5000 }
        );
      } else {
        toast.success(
          `Successfully synced ${totalCount} announcements! (${createdCount} new, ${updatedCount} updated)`,
          { duration: 5000 }
        );
      }
      
      // Wait a moment then reload to show updated announcements
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error('Error syncing announcements:', error);
      toast.error(error?.message || 'Failed to sync announcements');
    } finally {
      setSyncingAnnouncements(false);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button 
        onClick={handleSync} 
        disabled={loading || syncingAnnouncements}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {loading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Heart className="w-4 h-4" />
        )}
        {loading ? 'Syncing...' : 'Sync Members'}
      </Button>
      
      <Button 
        onClick={handleSyncAnnouncements} 
        disabled={loading || syncingAnnouncements}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {syncingAnnouncements ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Megaphone className="w-4 h-4" />
        )}
        {syncingAnnouncements ? 'Syncing...' : 'Sync Announcements'}
      </Button>
    </div>
  );
};
