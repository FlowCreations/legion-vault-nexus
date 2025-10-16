import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Users, TrendingUp, MapPin, DollarSign, Activity, Eye, ShoppingCart } from "lucide-react";

interface MetricsGridProps {
  totalEvents: number;
  totalUsers: number;
  superFans: number;
  totalPurchases?: number;
  totalRevenue?: number;
  avgEngagement?: number;
}

export const MetricsGrid = ({
  totalEvents,
  totalUsers,
  superFans,
  totalPurchases = 0,
  totalRevenue = 0,
  avgEngagement = 0
}: MetricsGridProps) => {
  const metrics = [
    {
      title: "Total Events",
      value: totalEvents.toLocaleString(),
      icon: BarChart,
      description: "User interactions",
      color: "text-blue-500"
    },
    {
      title: "Active Users",
      value: totalUsers.toLocaleString(),
      icon: Users,
      description: "Unique visitors",
      color: "text-green-500"
    },
    {
      title: "Super Fans",
      value: superFans.toLocaleString(),
      icon: TrendingUp,
      description: "Highly engaged",
      color: "text-primary"
    },
    {
      title: "Page Views",
      value: Math.floor(totalEvents * 0.7).toLocaleString(),
      icon: Eye,
      description: "Total views",
      color: "text-purple-500"
    },
    {
      title: "Purchases",
      value: totalPurchases.toLocaleString(),
      icon: ShoppingCart,
      description: "Total sales",
      color: "text-orange-500"
    },
    {
      title: "Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "Total earnings",
      color: "text-emerald-500"
    },
    {
      title: "Avg Engagement",
      value: avgEngagement.toFixed(1),
      icon: Activity,
      description: "Engagement score",
      color: "text-pink-500"
    },
    {
      title: "Locations",
      value: Math.floor(totalUsers * 0.3).toLocaleString(),
      icon: MapPin,
      description: "Unique cities",
      color: "text-cyan-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <Card key={idx} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
