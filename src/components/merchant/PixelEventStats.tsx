import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Eye, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PixelStats {
  totalEvents: number;
  todayEvents: number;
  weekEvents: number;
  pageViews: number;
  conversions: number;
  revenue: number;
  lastEvent: Date | null;
  isActive: boolean;
}

export const PixelEventStats = () => {
  const [stats, setStats] = useState<PixelStats>({
    totalEvents: 0,
    todayEvents: 0,
    weekEvents: 0,
    pageViews: 0,
    conversions: 0,
    revenue: 0,
    lastEvent: null,
    isActive: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPixelStats();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('pixel-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_events',
          filter: 'event_type=like.meta_pixel_%'
        },
        () => {
          loadPixelStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPixelStats = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get all pixel events
      const { data: allEvents, error } = await supabase
        .from('user_events')
        .select('*')
        .like('event_type', 'meta_pixel_%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const todayEvents = allEvents?.filter(e => new Date(e.created_at) >= todayStart) || [];
      const weekEvents = allEvents?.filter(e => new Date(e.created_at) >= weekAgo) || [];
      const pageViews = allEvents?.filter(e => e.event_type === 'meta_pixel_pageview') || [];
      const purchases = allEvents?.filter(e => e.event_type === 'meta_pixel_purchase') || [];
      
      const revenue = purchases.reduce((sum, e) => {
        const data = e.event_data as any;
        return sum + (data?.value || 0);
      }, 0);

      setStats({
        totalEvents: allEvents?.length || 0,
        todayEvents: todayEvents.length,
        weekEvents: weekEvents.length,
        pageViews: pageViews.length,
        conversions: purchases.length,
        revenue,
        lastEvent: allEvents?.[0]?.created_at ? new Date(allEvents[0].created_at) : null,
        isActive: allEvents && allEvents.length > 0,
      });
    } catch (error) {
      console.error('Error loading pixel stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Meta Pixel Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Meta Pixel Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${stats.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="font-semibold">
            {stats.isActive ? 'Active - Browser Tracking' : 'No Events Detected'}
          </span>
        </div>

        {stats.isActive && (
          <>
            <div className="text-sm text-muted-foreground">
              Last event: {stats.lastEvent ? formatDistanceToNow(stats.lastEvent, { addSuffix: true }) : 'Never'}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Activity className="h-4 w-4" />
                  Today
                </div>
                <div className="text-2xl font-bold">{stats.todayEvents.toLocaleString()}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <TrendingUp className="h-4 w-4" />
                  This Week
                </div>
                <div className="text-2xl font-bold">{stats.weekEvents.toLocaleString()}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Eye className="h-4 w-4" />
                  Page Views
                </div>
                <div className="text-2xl font-bold">{stats.pageViews.toLocaleString()}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <ShoppingCart className="h-4 w-4" />
                  Conversions
                </div>
                <div className="text-2xl font-bold">{stats.conversions.toLocaleString()}</div>
              </div>
            </div>

            {stats.revenue > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <DollarSign className="h-4 w-4" />
                    Total Revenue
                  </div>
                  <div className="text-xl font-bold">
                    ${stats.revenue.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
