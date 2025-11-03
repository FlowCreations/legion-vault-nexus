import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ViberateSyncButton = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadLastSync();
  }, []);

  const loadLastSync = async () => {
    try {
      const { data, error } = await supabase
        .from('viberate_metrics')
        .select('synced_at')
        .eq('artist_id', 'sons-of-legion')
        .order('synced_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setLastSync(data.synced_at);
      }
    } catch (error) {
      console.error('Failed to load last sync:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('idle');
    
    try {
      console.log('🔄 Starting Viberate sync...');
      
      const { data, error } = await supabase.functions.invoke('sync-viberate', {
        body: { artist_id: 'sons-of-legion' }
      });

      if (error) {
        console.error('❌ Sync error:', error);
        throw error;
      }

      console.log('✅ Sync response:', data);
      
      setLastSync(data.synced_at);
      setSyncStatus('success');
      toast.success('Viberate data synced successfully', {
        description: `Artist: ${data.artist || 'Sons of Legion'}`,
      });
      
      // Refresh the page to show updated data
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('❌ Sync failed:', error);
      setSyncStatus('error');
      toast.error('Failed to sync Viberate data', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
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
        {syncing ? 'Syncing...' : 'Sync Viberate'}
      </Button>
      
      {syncStatus === 'success' && (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-xs">Synced</span>
        </div>
      )}
      
      {syncStatus === 'error' && (
        <div className="flex items-center gap-1 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs">Failed</span>
        </div>
      )}
      
      {lastSync && (
        <span className="text-xs text-muted-foreground">
          Last synced: {new Date(lastSync).toLocaleString()}
        </span>
      )}
    </div>
  );
};