import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, DollarSign, Users, Target } from 'lucide-react';

export default function FunnelOverview() {
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    conversions: 0,
    conversionRate: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const { data: sessions } = await supabase
        .from('funnel_sessions')
        .select('*');

      const { data: conversions } = await supabase
        .from('funnel_conversions')
        .select('*')
        .eq('conversion_type', 'purchase');

      const totalSessions = sessions?.length || 0;
      const totalConversions = conversions?.length || 0;
      const totalRevenue = conversions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

      setMetrics({
        totalSessions,
        conversions: totalConversions,
        conversionRate: totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 0,
        totalRevenue,
        avgOrderValue: totalConversions > 0 ? totalRevenue / totalConversions : 0,
      });
    } catch (error) {
      console.error('Error loading funnel metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: 'Total Sessions',
      value: metrics.totalSessions,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      label: 'Conversions',
      value: metrics.conversions,
      icon: Target,
      color: 'text-green-500',
    },
    {
      label: 'Conversion Rate',
      value: `${metrics.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-500',
    },
    {
      label: 'Total Revenue',
      value: `$${metrics.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Funnel Performance</h3>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Average Order Value: ${metrics.avgOrderValue.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">
            Active Sessions: {metrics.totalSessions}
          </div>
        </div>
      </Card>
    </div>
  );
}
