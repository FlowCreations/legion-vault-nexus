import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Mail, TrendingUp, DollarSign } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

interface AbandonedCartMetrics {
  totalAbandoned: number;
  emailsSent: number;
  recovered: number;
  revenueRecovered: number;
  recoveryRate: number;
}

export const AbandonedCartAnalytics = () => {
  const [metrics, setMetrics] = useState<AbandonedCartMetrics>({
    totalAbandoned: 0,
    emailsSent: 0,
    recovered: 0,
    revenueRecovered: 0,
    recoveryRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const { data: carts, error } = await supabase
        .from('abandoned_carts')
        .select('*');

      if (error) throw error;

      const totalAbandoned = carts?.length || 0;
      const emailsSent = carts?.filter(c => c.email_sent_at).length || 0;
      const recovered = carts?.filter(c => c.status === 'recovered').length || 0;
      const revenueRecovered = carts
        ?.filter(c => c.status === 'recovered')
        .reduce((sum, c) => sum + (Number(c.cart_value) || 0), 0) || 0;
      const recoveryRate = totalAbandoned > 0 ? (recovered / totalAbandoned) * 100 : 0;

      setMetrics({
        totalAbandoned,
        emailsSent,
        recovered,
        revenueRecovered,
        recoveryRate,
      });
    } catch (error) {
      console.error('Error loading abandoned cart metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: "Total Abandoned",
      value: metrics.totalAbandoned,
      icon: ShoppingCart,
      color: "text-orange-500",
      format: (val: number) => val.toString(),
    },
    {
      label: "Emails Sent",
      value: metrics.emailsSent,
      icon: Mail,
      color: "text-blue-500",
      format: (val: number) => val.toString(),
    },
    {
      label: "Recovery Rate",
      value: metrics.recoveryRate,
      icon: TrendingUp,
      color: "text-green-500",
      format: (val: number) => `${val.toFixed(1)}%`,
    },
    {
      label: "Revenue Recovered",
      value: metrics.revenueRecovered,
      icon: DollarSign,
      color: "text-emerald-500",
      format: (val: number) => `$${val.toFixed(2)}`,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Abandoned Cart Analytics</h3>
        <p className="text-sm text-muted-foreground">
          Track recovery performance and revenue impact
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-card ${stat.color} bg-opacity-10`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  <AnimatedCounter
                    value={stat.value}
                    formatValue={stat.format}
                  />
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h4 className="font-semibold mb-4">Recovery Details</h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Carts Recovered</span>
            <span className="font-medium">{metrics.recovered} / {metrics.totalAbandoned}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email Delivery Rate</span>
            <span className="font-medium">
              {metrics.totalAbandoned > 0 
                ? `${((metrics.emailsSent / metrics.totalAbandoned) * 100).toFixed(1)}%` 
                : '0%'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg Cart Value (Recovered)</span>
            <span className="font-medium">
              ${metrics.recovered > 0 
                ? (metrics.revenueRecovered / metrics.recovered).toFixed(2) 
                : '0.00'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
