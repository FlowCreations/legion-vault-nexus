import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getPixelStatus } from "@/lib/metaPixel";
import { trackPageView } from "@/lib/metaPixel";
import { Activity, CheckCircle2, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";

export const PixelDebugPanel = () => {
  const [pixelStatus, setPixelStatus] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPixelStatus();
    loadRecentEvents();

    // Subscribe to real-time event updates
    const channel = supabase
      .channel('pixel-events-debug')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_events',
        filter: 'event_type=like.meta_pixel_%'
      }, (payload) => {
        console.log('[PixelDebug] New event detected:', payload.new);
        setRecentEvents(prev => [payload.new, ...prev.slice(0, 9)]);
        toast.success("New pixel event tracked!");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPixelStatus = () => {
    const status = getPixelStatus();
    console.log('[PixelDebug] Pixel status:', status);
    setPixelStatus(status);
  };

  const loadRecentEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .like('event_type', 'meta_pixel_%')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('[PixelDebug] Error loading events:', error);
      } else {
        console.log('[PixelDebug] Loaded recent events:', data);
        setRecentEvents(data || []);
      }
    } catch (err) {
      console.error('[PixelDebug] Exception loading events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fireTestEvent = () => {
    console.log('[PixelDebug] Firing test PageView event...');
    trackPageView();
    toast.success("Test event fired! Check console and events list.");
    setTimeout(() => loadRecentEvents(), 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Meta Pixel Debug Panel
        </CardTitle>
        <CardDescription>
          Real-time monitoring and debugging of Meta Pixel events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pixel Status */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Pixel Status</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant={pixelStatus?.isInitialized ? "default" : "destructive"} className="gap-1">
              {pixelStatus?.isInitialized ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {pixelStatus?.isInitialized ? "Initialized" : "Not Initialized"}
            </Badge>
            <Badge variant={pixelStatus?.isFbqLoaded ? "default" : "destructive"} className="gap-1">
              {pixelStatus?.isFbqLoaded ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {pixelStatus?.isFbqLoaded ? "Script Loaded" : "Script Not Loaded"}
            </Badge>
            {pixelStatus?.pixelId && (
              <Badge variant="outline">
                ID: {pixelStatus.pixelId}
              </Badge>
            )}
          </div>
        </div>

        {/* Test Button */}
        <div>
          <Button onClick={fireTestEvent} className="gap-2">
            <Zap className="h-4 w-4" />
            Fire Test Event
          </Button>
        </div>

        {/* Recent Events */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Recent Events ({recentEvents.length})</h4>
            <Button variant="outline" size="sm" onClick={loadRecentEvents}>
              Refresh
            </Button>
          </div>
          
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading events...</p>
          ) : recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events tracked yet. Click "Fire Test Event" to test.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentEvents.map((event) => (
                <div key={event.id} className="p-3 rounded-lg border bg-muted/50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold">
                      {event.event_type?.replace('meta_pixel_', '')}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {event.page_url && (
                    <div className="text-muted-foreground">
                      Page: {event.page_url}
                    </div>
                  )}
                  {event.event_data && Object.keys(event.event_data).length > 0 && (
                    <details className="text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">
                        Event Data
                      </summary>
                      <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                        {JSON.stringify(event.event_data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Console Instructions */}
        <div className="p-3 rounded-lg border bg-muted/30 text-xs space-y-1">
          <p className="font-semibold">Browser Console Check:</p>
          <code className="block bg-background p-2 rounded">
            window.fbq // Should be a function
          </code>
          <p className="text-muted-foreground">
            Open browser DevTools → Console and run the above command
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
