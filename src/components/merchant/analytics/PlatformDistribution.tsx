import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { parsePlatformDistribution, formatNumber } from "@/utils/analyticsDataParser";
import type { PlatformDistributionData } from "@/types/analytics";

const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];

export const PlatformDistribution = () => {
  const [data, setData] = useState<PlatformDistributionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const distribution = await parsePlatformDistribution();
      setData(distribution);
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
          <CardTitle>Platform Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <p className="text-muted-foreground">
            No distribution data available. Check console for errors.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalFollowers = data.reduce((sum, item) => sum + item.followers, 0);

  const pieData = data.map((item, index) => ({
    name: item.platform,
    value: item.followers,
    percentage: item.percentage,
  }));

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Platform Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">
          Total: {formatNumber(totalFollowers)} followers
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={130}
              paddingAngle={3}
              dataKey="value"
              label={(entry) => `${entry.name} ${entry.percentage.toFixed(1)}%`}
              labelLine={true}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatNumber(value)}
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={{ color: 'hsl(var(--foreground))' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
