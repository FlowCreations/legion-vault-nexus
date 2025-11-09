import { useEffect, useState, memo } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Music, Users, Radio, Hash } from "lucide-react";
import { parseViberateProfile, formatNumber, formatPercentage } from "@/utils/analyticsDataParser";
import type { ViberateMetrics } from "@/types/analytics";

export const PlatformOverview = () => {
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
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  if (!metrics) return null;

  const totalFans = 
    metrics.spotify.followers +
    metrics.youtube.subscribers +
    metrics.tiktok.followers +
    metrics.instagram.followers +
    metrics.facebook.followers;

  const totalGrowth =
    metrics.spotify.followersChange1m +
    metrics.youtube.subscribersChange1m +
    metrics.tiktok.followersChange1m +
    metrics.instagram.followersChange1m +
    metrics.facebook.followersChange1m;

  const growthPercent = (totalGrowth / (totalFans - totalGrowth)) * 100;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Fanbase</p>
              <h3 className="text-3xl font-bold mt-2">{formatNumber(totalFans)}</h3>
              <p className="text-sm mt-1 flex items-center gap-1">
                {growthPercent >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={growthPercent >= 0 ? "text-success" : "text-destructive"}>
                  {formatPercentage(growthPercent)}
                </span>
                <span className="text-muted-foreground">this month</span>
              </p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Listeners</p>
              <h3 className="text-3xl font-bold mt-2">{formatNumber(metrics.spotify.monthlyListeners)}</h3>
              <p className="text-sm mt-1 flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-success">
                  {formatPercentage((metrics.spotify.monthlyListenersChange1m / (metrics.spotify.monthlyListeners - metrics.spotify.monthlyListenersChange1m)) * 100)}
                </span>
              </p>
            </div>
            <Music className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Radio Airplay</p>
              <h3 className="text-3xl font-bold mt-2">{metrics.radio.stations}</h3>
              <p className="text-sm text-muted-foreground mt-1">{metrics.radio.countries} countries</p>
            </div>
            <Radio className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Spotify</p>
              <h3 className="text-3xl font-bold mt-2">{formatNumber(metrics.spotify.followers)}</h3>
              <p className="text-sm mt-1 flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-success">
                  {formatPercentage((metrics.spotify.followersChange1m / (metrics.spotify.followers - metrics.spotify.followersChange1m)) * 100)}
                </span>
                <span className="text-muted-foreground">this month</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{formatNumber(metrics.spotify.monthlyListeners)} listeners</p>
            </div>
            <span className="text-4xl">🎵</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default memo(PlatformOverview);
