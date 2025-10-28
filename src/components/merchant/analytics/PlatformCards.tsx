import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { parseViberateProfile, formatNumber, formatPercentage, calculateGrowthMetrics } from "@/utils/analyticsDataParser";
import type { ViberateMetrics, GrowthMetrics } from "@/types/analytics";

export const PlatformCards = () => {
  const [metrics, setMetrics] = useState<ViberateMetrics | null>(null);
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      const data = await parseViberateProfile();
      setMetrics(data);
      if (data) {
        setGrowthMetrics(calculateGrowthMetrics(data));
      }
      setLoading(false);
    };
    loadMetrics();
  }, []);

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>;
  }

  if (!metrics) return null;

  const platforms = [
    {
      name: 'Spotify',
      icon: '🎵',
      followers: metrics.spotify.followers,
      change: metrics.spotify.followersChange1m,
      changePercent: (metrics.spotify.followersChange1m / (metrics.spotify.followers - metrics.spotify.followersChange1m)) * 100,
      metric: `${formatNumber(metrics.spotify.monthlyListeners)} listeners`,
    },
    {
      name: 'Instagram',
      icon: '📸',
      followers: metrics.instagram.followers,
      change: metrics.instagram.followersChange1m,
      changePercent: (metrics.instagram.followersChange1m / (metrics.instagram.followers - metrics.instagram.followersChange1m)) * 100,
      metric: `${formatNumber(metrics.instagram.likes1m)} likes/mo`,
    },
    {
      name: 'TikTok',
      icon: '🎬',
      followers: metrics.tiktok.followers,
      change: metrics.tiktok.followersChange1m,
      changePercent: (metrics.tiktok.followersChange1m / (metrics.tiktok.followers - metrics.tiktok.followersChange1m)) * 100,
      metric: `${formatNumber(metrics.tiktok.views1m)} views/mo`,
    },
    {
      name: 'Facebook',
      icon: '👥',
      followers: metrics.facebook.followers,
      change: metrics.facebook.followersChange1m,
      changePercent: (metrics.facebook.followersChange1m / (metrics.facebook.followers - metrics.facebook.followersChange1m)) * 100,
      metric: 'Largest platform',
    },
    {
      name: 'YouTube',
      icon: '📹',
      followers: metrics.youtube.subscribers,
      change: metrics.youtube.subscribersChange1m,
      changePercent: (metrics.youtube.subscribersChange1m / (metrics.youtube.subscribers - metrics.youtube.subscribersChange1m)) * 100,
      metric: `${formatNumber(metrics.youtube.totalViews)} views`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {platforms.map((platform) => (
        <Card key={platform.name} className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{platform.icon}</span>
            {platform.changePercent >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </div>
          <h4 className="text-sm font-medium text-muted-foreground">{platform.name}</h4>
          <p className="text-2xl font-bold mt-1">{formatNumber(platform.followers)}</p>
          <p className="text-xs mt-1">
            <span className={platform.changePercent >= 0 ? "text-success" : "text-destructive"}>
              {formatPercentage(platform.changePercent)}
            </span>
            <span className="text-muted-foreground ml-1">this month</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{platform.metric}</p>
        </Card>
      ))}
    </div>
  );
};
