import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { parsePlatformDistribution, formatNumber } from "@/utils/analyticsDataParser";
import type { PlatformDistributionData } from "@/types/analytics";

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

  const totalFollowers = data.reduce((sum, item) => sum + item.followers, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">
          Total: {formatNumber(totalFollowers)} followers
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ platform, percentage }) => `${platform} ${percentage.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="followers"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatNumber(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
