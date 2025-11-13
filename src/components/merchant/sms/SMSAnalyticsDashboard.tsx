import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp } from "lucide-react";

export const SMSAnalyticsDashboard = () => {
  const mockData = [
    { date: "Mon", sent: 0, delivered: 0, clicked: 0 },
    { date: "Tue", sent: 0, delivered: 0, clicked: 0 },
    { date: "Wed", sent: 0, delivered: 0, clicked: 0 },
    { date: "Thu", sent: 0, delivered: 0, clicked: 0 },
    { date: "Fri", sent: 0, delivered: 0, clicked: 0 },
    { date: "Sat", sent: 0, delivered: 0, clicked: 0 },
    { date: "Sun", sent: 0, delivered: 0, clicked: 0 },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>SMS Performance</CardTitle>
          <CardDescription>Track delivery, engagement, and conversion metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="sent" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="delivered" stroke="hsl(142 71% 45%)" strokeWidth={2} />
              <Line type="monotone" dataKey="clicked" stroke="hsl(48 96% 53%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Channel Performance</CardTitle>
            <CardDescription>Compare SMS vs Email effectiveness</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Click Rate</span>
                <span className="text-sm font-medium">0%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SMS Click Rate</span>
                <span className="text-sm font-medium">0%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Combined Reach</span>
                <span className="text-sm font-medium">0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Best Performing Segments
            </CardTitle>
            <CardDescription>Top segments by conversion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              No data yet - launch your first SMS campaign
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
