import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Users, Eye, Clock, TrendingUp, Target, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AnalyticsData {
  totalEvents: number;
  uniqueUsers: number;
  videoViews: number;
  musicPlays: number;
  avgWatchTime: number;
  avgListenTime: number;
  ptpScores: {
    green: number;
    yellow: number;
    red: number;
  };
  topEvents: Array<{ type: string; count: number }>;
  recentActivity: Array<{
    user_id: string;
    type: string;
    created_at: string;
  }>;
}

export const MarketingAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Get events summary
      const { data: eventStats } = await supabase
        .from('events')
        .select('type, member_id, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Get PTP score distribution
      const { data: ptpData } = await supabase
        .from('user_profiles')
        .select('ptp_status, watch_time, listen_time');

      // Process data
      const uniqueUsers = new Set(eventStats?.map(e => e.member_id) || []).size;
      const videoViews = eventStats?.filter(e => 
        e.type === 'watch_start' || e.type === 'watch_complete'
      ).length || 0;
      const musicPlays = eventStats?.filter(e => 
        e.type === 'listen_start' || e.type === 'listen_complete'
      ).length || 0;

      // Count event types
      const eventCounts: Record<string, number> = {};
      eventStats?.forEach(e => {
        eventCounts[e.type] = (eventCounts[e.type] || 0) + 1;
      });

      const topEvents = Object.entries(eventCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // PTP distribution
      const ptpScores = {
        green: ptpData?.filter(p => p.ptp_status === 'green').length || 0,
        yellow: ptpData?.filter(p => p.ptp_status === 'yellow').length || 0,
        red: ptpData?.filter(p => p.ptp_status === 'red').length || 0,
      };

      // Calculate averages
      const totalWatchTime = ptpData?.reduce((sum, p) => sum + (p.watch_time || 0), 0) || 0;
      const totalListenTime = ptpData?.reduce((sum, p) => sum + (p.listen_time || 0), 0) || 0;
      const avgWatchTime = ptpData?.length ? totalWatchTime / ptpData.length : 0;
      const avgListenTime = ptpData?.length ? totalListenTime / ptpData.length : 0;

      setAnalytics({
        totalEvents: eventStats?.length || 0,
        uniqueUsers,
        videoViews,
        musicPlays,
        avgWatchTime: Math.round(avgWatchTime),
        avgListenTime: Math.round(avgListenTime),
        ptpScores,
        topEvents,
        recentActivity: (eventStats || []).slice(0, 10).map(e => ({
          user_id: e.member_id || 'Anonymous',
          type: e.type,
          created_at: e.created_at,
        })),
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  const totalPtpUsers = analytics.ptpScores.green + analytics.ptpScores.yellow + analytics.ptpScores.red;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Marketing & AI Analytics</h2>
        <p className="text-muted-foreground mt-2">
          Comprehensive view of user engagement and AI-powered insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events (7d)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              User interactions tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">
              Unique users this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Video Engagement</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.videoViews}</div>
            <p className="text-xs text-muted-foreground">
              Avg {Math.round(analytics.avgWatchTime / 60)}min watch time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Music Engagement</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.musicPlays}</div>
            <p className="text-xs text-muted-foreground">
              Avg {Math.round(analytics.avgListenTime / 60)}min listen time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PTP Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            PTP (Propensity to Purchase) Score Distribution
          </CardTitle>
          <CardDescription>
            AI-calculated purchase likelihood based on engagement, recency, frequency, and behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">High Intent (70-100)</span>
                <Badge variant="default" className="bg-green-500">
                  {analytics.ptpScores.green} users
                </Badge>
              </div>
              <Progress 
                value={totalPtpUsers > 0 ? (analytics.ptpScores.green / totalPtpUsers) * 100 : 0} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {totalPtpUsers > 0 ? Math.round((analytics.ptpScores.green / totalPtpUsers) * 100) : 0}% of scored users
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Medium Intent (40-69)</span>
                <Badge variant="secondary" className="bg-yellow-500 text-black">
                  {analytics.ptpScores.yellow} users
                </Badge>
              </div>
              <Progress 
                value={totalPtpUsers > 0 ? (analytics.ptpScores.yellow / totalPtpUsers) * 100 : 0} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {totalPtpUsers > 0 ? Math.round((analytics.ptpScores.yellow / totalPtpUsers) * 100) : 0}% of scored users
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Low Intent (0-39)</span>
                <Badge variant="destructive">
                  {analytics.ptpScores.red} users
                </Badge>
              </div>
              <Progress 
                value={totalPtpUsers > 0 ? (analytics.ptpScores.red / totalPtpUsers) * 100 : 0} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {totalPtpUsers > 0 ? Math.round((analytics.ptpScores.red / totalPtpUsers) * 100) : 0}% of scored users
              </p>
            </div>
          </div>

          {totalPtpUsers === 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <p className="font-medium">No PTP Scores Yet</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                PTP scores are calculated automatically as users interact with your content. 
                Scores consider: engagement level (25%), recency (20%), frequency (20%), monetary value (20%), and loyalty (15%).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Event Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top User Actions
          </CardTitle>
          <CardDescription>Most frequent interactions in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.topEvents.length > 0 ? (
            <div className="space-y-3">
              {analytics.topEvents.map((event, i) => (
                <div key={event.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-muted-foreground">#{i + 1}</span>
                    <span className="font-medium capitalize">{event.type.replace(/_/g, ' ')}</span>
                  </div>
                  <Badge variant="outline">{event.count} times</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No events tracked yet</p>
          )}
        </CardContent>
      </Card>

      {/* Data Collection Status */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>AI Data Collection Status</CardTitle>
          <CardDescription>
            Verify what user interactions are being captured for AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Page Views', tracked: analytics.totalEvents > 0, value: analytics.topEvents.find(e => e.type === 'page_view')?.count || 0 },
              { label: 'Video Views', tracked: analytics.videoViews > 0, value: analytics.videoViews },
              { label: 'Music Plays', tracked: analytics.musicPlays > 0, value: analytics.musicPlays },
              { label: 'Cart Actions', tracked: analytics.topEvents.some(e => e.type.includes('cart')), value: analytics.topEvents.find(e => e.type.includes('cart'))?.count || 0 },
              { label: 'Purchases', tracked: analytics.topEvents.some(e => e.type === 'purchase_completed'), value: analytics.topEvents.find(e => e.type === 'purchase_completed')?.count || 0 },
              { label: 'Subscriptions', tracked: analytics.topEvents.some(e => e.type === 'subscribe'), value: analytics.topEvents.find(e => e.type === 'subscribe')?.count || 0 },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-2xl font-bold">{item.value}</p>
                </div>
                {item.tracked ? (
                  <Badge className="bg-green-500">Active</Badge>
                ) : (
                  <Badge variant="secondary">No Data</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
