import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle, XCircle, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const FacebookInsightsSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { toast } = useToast();

  const syncFacebookInsights = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-meta-insights');

      if (error) throw error;

      if (data.success) {
        setLastSync(new Date());
        toast({
          title: "Sync Successful",
          description: `Fetched ${data.insightsFetched} days of Facebook insights`,
        });
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to fetch Facebook insights",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Facebook Insights Sync
        </CardTitle>
        <CardDescription>
          Fetch official pixel statistics from Facebook's servers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {lastSync ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    Last synced: {lastSync.toLocaleString()}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Never synced
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Syncs last 30 days of data from Facebook
            </p>
          </div>

          <Button
            onClick={syncFacebookInsights}
            disabled={syncing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-semibold">What gets synced:</h4>
          <div className="grid grid-cols-2 gap-2">
            <Badge variant="outline" className="justify-center">Event Counts</Badge>
            <Badge variant="outline" className="justify-center">Unique Users</Badge>
            <Badge variant="outline" className="justify-center">Conversions</Badge>
            <Badge variant="outline" className="justify-center">Page Views</Badge>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
          <strong>Note:</strong> Facebook API provides aggregated statistics. 
          For event-level tracking, use browser-side pixel events shown in the Analytics tab.
        </div>
      </CardContent>
    </Card>
  );
};
