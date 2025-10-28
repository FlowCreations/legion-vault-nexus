import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from "recharts";
import { parsePlatformDistribution, formatNumber } from "@/utils/analyticsDataParser";
import type { PlatformDistributionData } from "@/types/analytics";
import { AnimatedCounter } from "./AnimatedCounter";

const PLATFORM_GRADIENTS = {
  Facebook: { id: 'fbGradient', start: '#3b5998', end: '#4267b2' },
  Instagram: { id: 'igGradient', start: '#fd1d1d', end: '#833ab4' },
  TikTok: { id: 'ttGradient', start: '#69C9D0', end: '#010101' },
  Spotify: { id: 'spGradient', start: '#1DB954', end: '#15803d' },
  YouTube: { id: 'ytGradient', start: '#ff0000', end: '#b91c1c' },
  Deezer: { id: 'dzGradient', start: '#06b6d4', end: '#0891b2' },
  Soundcloud: { id: 'scGradient', start: '#f59e0b', end: '#d97706' },
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.3))' }}
      />
    </g>
  );
};

export const PlatformDistribution = () => {
  const [data, setData] = useState<PlatformDistributionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  useEffect(() => {
    const loadData = async () => {
      const distribution = await parsePlatformDistribution();
      setData(distribution);
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
          <CardTitle className="font-semibold text-xl tracking-wide">Platform Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No distribution data available</p>
        </CardContent>
      </Card>
    );
  }

  // Filter out Soundcloud
  const filteredData = data.filter(item => item.platform !== 'Soundcloud');
  
  const totalFollowers = filteredData.reduce((sum, item) => sum + item.followers, 0);

  const pieData = filteredData.map((item) => ({
    name: item.platform,
    value: item.followers,
    percentage: item.percentage,
  }));

  return (
    <Card className="bg-[#121317] border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.04)] rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CardHeader className="pb-2">
        <CardTitle className="font-semibold text-xl tracking-wide text-[#f1f5f9]">
          Platform Distribution
        </CardTitle>
        <p className="text-sm text-[#9ca3af] mt-1">
          Total: <span className="text-[#f1f5f9] font-medium">
            <AnimatedCounter value={totalFollowers} formatValue={(v) => formatNumber(v)} />
          </span> followers
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={450}>
          <PieChart>
            <defs>
              {Object.entries(PLATFORM_GRADIENTS).map(([platform, gradient]) => (
                <linearGradient key={gradient.id} id={gradient.id} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={gradient.start} />
                  <stop offset="100%" stopColor={gradient.end} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={140}
              paddingAngle={3}
              dataKey="value"
              label={(entry) => (
                <text
                  x={entry.x}
                  y={entry.y}
                  fill="white"
                  textAnchor={entry.x > entry.cx ? 'start' : 'end'}
                  dominantBaseline="central"
                  className="text-xs font-semibold"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                >
                  {`${entry.name} ${entry.percentage.toFixed(1)}%`}
                </text>
              )}
              labelLine={{ stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1 }}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
              animationBegin={0}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {pieData.map((entry, index) => {
                const gradientId = PLATFORM_GRADIENTS[entry.name as keyof typeof PLATFORM_GRADIENTS]?.id;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={gradientId ? `url(#${gradientId})` : '#666'}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  />
                );
              })}
            </Pie>
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
              itemStyle={{ color: '#f3f4f6' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={60}
              wrapperStyle={{ 
                color: '#f1f5f9',
                paddingTop: '20px'
              }}
              iconType="circle"
              formatter={(value) => <span className="text-sm font-medium">{value}</span>}
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-3xl font-bold fill-[#f1f5f9]"
              style={{ 
                filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.3))',
                animation: 'glowPulse 3s ease-in-out infinite'
              }}
            >
              <AnimatedCounter value={totalFollowers} formatValue={(v) => formatNumber(v)} />
            </text>
            <text
              x="50%"
              y="50%"
              dy="25"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs fill-[#9ca3af]"
            >
              Total Followers
            </text>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
