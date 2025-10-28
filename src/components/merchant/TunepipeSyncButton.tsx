import { Button } from "@/components/ui/button";
import { Loader2, Database } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TUNEPIPE_API_BASE = 'https://websitebuilder.tunepipe.com/api/v1';
const TUNEPIPE_API_KEY = 'wb631614790084bdaa55e0eb7ce955ef7';

export const TunepipeSyncButton = ({ onSyncComplete }: { onSyncComplete?: () => void }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      toast.info('Starting Tunepipe sync...', { duration: 2000 });

      // Fetch data directly from Tunepipe API (client-side, bypasses Cloudflare)
      const headers = {
        'Authorization': `Bearer ${TUNEPIPE_API_KEY}`,
        'Content-Type': 'application/json'
      };

      console.log('Fetching campaigns from Tunepipe...');
      const campaignsResponse = await fetch(`${TUNEPIPE_API_BASE}/subscriber-lists`, { headers });
      const campaigns = campaignsResponse.ok ? await campaignsResponse.json() : [];
      console.log('Campaigns fetched:', campaigns.length);

      console.log('Fetching subscribers from Tunepipe...');
      const subscribersResponse = await fetch(`${TUNEPIPE_API_BASE}/contacts?subscribed=true&limit=100`, { headers });
      const subscribers = subscribersResponse.ok ? await subscribersResponse.json() : [];
      console.log('Subscribers fetched:', subscribers.length);

      console.log('Fetching analytics from Tunepipe...');
      const analyticsResponse = await fetch(`${TUNEPIPE_API_BASE}/contacts?limit=100`, { headers });
      const analytics = analyticsResponse.ok ? await analyticsResponse.json() : [];
      console.log('Analytics fetched:', analytics.length);

      // Send data to edge function to store in database
      console.log('Storing data in database...');
      const { data, error } = await supabase.functions.invoke('store-tunepipe-data', {
        body: { 
          campaigns: campaigns.data?.items || campaigns.items || campaigns || [],
          subscribers: subscribers.data?.items || subscribers.items || subscribers || [],
          analytics: analytics.data?.items || analytics.items || analytics || []
        }
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
