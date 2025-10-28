import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { parseEngagementTimeline, formatNumber } from "@/utils/analyticsDataParser";
import type { DailyEngagementData } from "@/types/analytics";
import { format } from "date-fns";

const PLATFORM_COLORS = {
  Spotify: '#1DB954',
  Instagram: '#E4405F',
  TikTok: '#00F2EA',
  Facebook: '#1877F2',
  YouTube: '#FF0000',
};

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
          <p className="text-muted-foreground">
            No timeline data available. Check console for errors.
          </p>
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
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Engagement Timeline</CardTitle>
        <p className="text-sm text-muted-foreground">
          Follower growth across all platforms (March 2023 - October 2025)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={formatNumber}
              width={60}
            />
            <Tooltip
              formatter={(value: number) => formatNumber(value)}
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Legend 
              wrapperStyle={{ color: '#f3f4f6' }}
              iconType="line"
            />
            <Line 
              type="monotone" 
              dataKey="Spotify" 
              stroke={PLATFORM_COLORS.Spotify} 
              strokeWidth={2.5} 
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="Instagram" 
              stroke={PLATFORM_COLORS.Instagram} 
              strokeWidth={2.5} 
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="TikTok" 
              stroke={PLATFORM_COLORS.TikTok} 
              strokeWidth={2.5} 
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="Facebook" 
              stroke={PLATFORM_COLORS.Facebook} 
              strokeWidth={2.5} 
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="YouTube" 
              stroke={PLATFORM_COLORS.YouTube} 
              strokeWidth={2.5} 
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
