import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { parseViberateProfile, formatNumber, formatPercentage } from "@/utils/analyticsDataParser";
import type { ViberateMetrics } from "@/types/analytics";

export const StreamsOverview = () => {
  const [metrics, setMetrics] = useState<ViberateMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      const data = await parseViberateProfile();
      setMetrics(data);
      setLoading(false);
    };
    loadMetrics();
  }, []);

  if (loading) {
    return <Card className="w-full"><CardContent className="h-64 animate-pulse bg-muted" /></Card>;
  }

  if (!metrics) return null;

  const totalStreams = metrics.spotify.totalStreams;
  const monthlyStreams = metrics.spotify.totalStreamsChange1m;
  const monthlyListeners = metrics.spotify.monthlyListeners;
  const playlistReach = metrics.spotify.playlistReach;
  
  const streamsPerListener = monthlyListeners > 0 ? (monthlyStreams / monthlyListeners).toFixed(1) : 0;
  const growthPercent = ((monthlyStreams / (totalStreams - monthlyStreams)) * 100);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Spotify Streams Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Streams</p>
              <p className="text-2xl font-bold">{formatNumber(totalStreams)}</p>
              <p className="text-xs text-success mt-1">{formatPercentage(growthPercent)} this month</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Listeners</p>
              <p className="text-2xl font-bold">{formatNumber(monthlyListeners)}</p>
              <p className="text-xs text-muted-foreground mt-1">{streamsPerListener} streams/listener</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Streams This Month</p>
              <p className="text-xl font-semibold">{formatNumber(monthlyStreams)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Playlist Reach</p>
              <p className="text-xl font-semibold">{formatNumber(playlistReach)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
