import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { parseEngagementTimeline, formatNumber } from "@/utils/analyticsDataParser";
import type { DailyEngagementData } from "@/types/analytics";
import { format, subMonths } from "date-fns";
import { TimeRangeFilter, type TimeRange } from "./TimeRangeFilter";

const PLATFORM_COLORS = {
  Spotify: '#1DB954',
  Instagram: '#E1306C',
  TikTok: '#69C9D0',
  Facebook: '#3b5998',
  YouTube: '#FF0000',
};

const PLATFORMS = ['Spotify', 'Instagram', 'TikTok', 'Facebook', 'YouTube'] as const;

export const EngagementTimeline = () => {
  const [data, setData] = useState<DailyEngagementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");
  const [visiblePlatforms, setVisiblePlatforms] = useState<Set<string>>(new Set(PLATFORMS));

  useEffect(() => {
    const loadData = async () => {
      const timeline = await parseEngagementTimeline();
      setData(timeline);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <Card className="bg-[#121317] border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.04)]">
        <CardContent className="h-[500px] animate-pulse bg-muted/10" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-[#121317] border-white/[0.08]">
        <CardHeader>
          <CardTitle className="font-semibold text-xl tracking-wide">Engagement Timeline</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No timeline data available</p>
        </CardContent>
      </Card>
    );
  }

  const filterDataByRange = (data: DailyEngagementData[]) => {
    if (timeRange === "ALL") return data;
    
    const now = new Date();
    const monthsMap: Record<TimeRange, number> = { "3M": 3, "6M": 6, "1Y": 12, "ALL": 999 };
    const cutoffDate = subMonths(now, monthsMap[timeRange]);
    
    return data.filter(item => new Date(item.date) >= cutoffDate);
  };

  const filteredData = filterDataByRange(data);
  const sampledData = filteredData.filter((_, index) => index % 7 === 0);

  const chartData = sampledData.map(item => ({
    date: format(new Date(item.date), 'MMM yy'),
    Spotify: item.spotify.followers,
    Instagram: item.instagram.followers,
    TikTok: item.tiktok.followers,
    Facebook: item.facebook.followers,
    YouTube: item.youtube.subscribers,
  }));

  const togglePlatform = (platform: string) => {
    const newVisible = new Set(visiblePlatforms);
    if (newVisible.has(platform)) {
      newVisible.delete(platform);
    } else {
      newVisible.add(platform);
    }
    setVisiblePlatforms(newVisible);
  };

  const CustomLegend = () => (
    <div className="flex gap-3 justify-center flex-wrap mt-4">
      {PLATFORMS.map((platform) => {
        const isVisible = visiblePlatforms.has(platform);
        return (
          <button
            key={platform}
            onClick={() => togglePlatform(platform)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium
              transition-all duration-300 cursor-pointer
              ${isVisible 
                ? 'bg-white/10 backdrop-blur-sm shadow-lg' 
                : 'bg-white/5 opacity-50'
              }
              hover:bg-white/15 hover:scale-105
            `}
            style={{
              boxShadow: isVisible ? `0 0 20px ${PLATFORM_COLORS[platform]}40` : 'none'
            }}
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: PLATFORM_COLORS[platform] }}
            />
            <span className="text-[#f1f5f9]">{platform}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <Card className="bg-[#121317] border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.04)] rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="font-semibold text-xl tracking-wide text-[#f1f5f9]">
              Engagement Timeline
            </CardTitle>
            <p className="text-sm text-[#9ca3af] mt-1">
              Follower growth across all platforms
            </p>
          </div>
          <TimeRangeFilter selected={timeRange} onChange={setTimeRange} />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart 
            data={chartData} 
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              {PLATFORMS.map((platform) => (
                <linearGradient key={platform} id={`gradient-${platform}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PLATFORM_COLORS[platform]} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={PLATFORM_COLORS[platform]} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              tick={{ fill: '#d1d5db', fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#d1d5db', fontSize: 12 }}
              tickFormatter={formatNumber}
              width={70}
            />
            <Tooltip
              formatter={(value: number) => formatNumber(value)}
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#f3f4f6',
                padding: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
              }}
              labelStyle={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 8 }}
              itemStyle={{ color: '#f3f4f6', padding: '4px 0' }}
            />
            {PLATFORMS.map((platform) => (
              visiblePlatforms.has(platform) && (
                <Area
                  key={`area-${platform}`}
                  type="monotone"
                  dataKey={platform}
                  stroke="none"
                  fill={`url(#gradient-${platform})`}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              )
            ))}
            {PLATFORMS.map((platform) => (
              visiblePlatforms.has(platform) && (
                <Line
                  key={`line-${platform}`}
                  type="monotone"
                  dataKey={platform}
                  stroke={PLATFORM_COLORS[platform]}
                  strokeWidth={4}
                  dot={false}
                  activeDot={{ 
                    r: 8, 
                    strokeWidth: 3, 
                    stroke: '#fff',
                    fill: PLATFORM_COLORS[platform],
                    style: { filter: `drop-shadow(0 0 12px ${PLATFORM_COLORS[platform]})` }
                  }}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  style={{
                    filter: `drop-shadow(0 2px 8px ${PLATFORM_COLORS[platform]}99)`
                  }}
                />
              )
            ))}
          </AreaChart>
        </ResponsiveContainer>
        <CustomLegend />
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-[#6b7280]">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Data synced from API • Updated live</span>
        </div>
      </CardContent>
    </Card>
  );
};
