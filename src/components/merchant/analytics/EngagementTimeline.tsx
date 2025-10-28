import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { parseEngagementTimeline, formatNumber } from "@/utils/analyticsDataParser";
import type { DailyEngagementData } from "@/types/analytics";
import { format } from "date-fns";

export const EngagementTimeline = () => {
  const [data, setData] = useState<DailyEngagementData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const timeline = await parseEngagementTimeline();
      // Sample data to show trends (every 7th day for performance)
      const sampledData = timeline.filter((_, index) => index % 7 === 0);
      setData(sampledData);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return <Card><CardContent className="h-96 animate-pulse bg-muted" /></Card>;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Engagement Timeline</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <p className="text-muted-foreground">No timeline data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    date: format(new Date(item.date), 'MMM yy'),
    Spotify: item.spotify.followers,
    Instagram: item.instagram.followers,
    TikTok: item.tiktok.followers,
    Facebook: item.facebook.followers,
    YouTube: item.youtube.subscribers,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Timeline</CardTitle>
        <p className="text-sm text-muted-foreground">
          Follower growth across all platforms (March 2023 - October 2025)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={formatNumber}
            />
            <Tooltip
              formatter={(value: number) => formatNumber(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="Spotify" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Instagram" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="TikTok" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Facebook" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="YouTube" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
