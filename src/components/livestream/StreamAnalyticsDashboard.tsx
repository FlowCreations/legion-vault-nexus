import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Heart, DollarSign, TrendingUp, Clock, Eye } from 'lucide-react';

interface AnalyticsDashboardProps {
  eventId: string;
}

interface ViewershipData {
  timestamp: string;
  viewers: number;
}

interface EngagementData {
  hearts: number;
  claps: number;
  comments: number;
  shares: number;
}

interface RevenueData {
  timestamp: string;
  amount: number;
  type: string;
}

export const StreamAnalyticsDashboard = ({ eventId }: AnalyticsDashboardProps) => {
  const [viewershipData, setViewershipData] = useState<ViewershipData[]>([]);
  const [peakViewers, setPeakViewers] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [avgViewDuration, setAvgViewDuration] = useState(0);
  const [engagement, setEngagement] = useState<EngagementData>({ hearts: 0, claps: 0, comments: 0, shares: 0 });
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    
    const channel = supabase
      .channel(`analytics-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'livestream_reactions', filter: `event_id=eq.${eventId}` }, () => {
        fetchAnalytics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    
    // Fetch viewership data
    const { data: viewerData } = await supabase
      .from('livestream_viewers')
      .select('*')
      .eq('event_id', eventId)
      .order('joined_at', { ascending: true });

    if (viewerData) {
      // Process viewership over time (5-minute intervals)
      const timelineData: ViewershipData[] = [];
      const viewersByTime = new Map<string, Set<string>>();
      
      viewerData.forEach(viewer => {
        const time = new Date(viewer.joined_at);
        const interval = Math.floor(time.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000);
        const timeKey = new Date(interval).toISOString();
        
        if (!viewersByTime.has(timeKey)) {
          viewersByTime.set(timeKey, new Set());
        }
        viewersByTime.get(timeKey)?.add(viewer.user_id || viewer.session_id);
      });

      viewersByTime.forEach((viewers, timestamp) => {
        timelineData.push({
          timestamp: new Date(timestamp).toLocaleTimeString(),
          viewers: viewers.size
        });
      });

      setViewershipData(timelineData);
      
      const peak = Math.max(...timelineData.map(d => d.viewers), 0);
      setPeakViewers(peak);
      setTotalViews(viewerData.length);
      
      // Calculate average view duration
      const durations = viewerData
        .filter(v => v.left_at)
        .map(v => {
          const joined = new Date(v.joined_at).getTime();
          const left = new Date(v.left_at!).getTime();
          return (left - joined) / 1000 / 60; // minutes
        });
      const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      setAvgViewDuration(Math.round(avgDuration));
    }

    // Fetch engagement data
    const { data: reactions } = await supabase
      .from('livestream_reactions')
      .select('reaction_type')
      .eq('event_id', eventId);

    if (reactions) {
      const hearts = reactions.filter(r => r.reaction_type === 'heart').length;
      const claps = reactions.filter(r => r.reaction_type === 'clap').length;
      setEngagement({ hearts, claps, comments: 0, shares: 0 });
    }

    // Fetch revenue data (tips during stream)
    // Note: Tips table integration would go here when available
    const tips: any[] = [];

    if (tips) {
      const revenueTimeline = tips.map(tip => ({
        timestamp: new Date(tip.created_at).toLocaleTimeString(),
        amount: tip.amount,
        type: 'tip'
      }));
      setRevenue(revenueTimeline);
      
      const total = tips.reduce((sum, tip) => sum + tip.amount, 0);
      setTotalRevenue(total);
    }

    setLoading(false);
  };

  const engagementChartData = [
    { name: 'Hearts', value: engagement.hearts, color: 'hsl(var(--destructive))' },
    { name: 'Claps', value: engagement.claps, color: 'hsl(var(--primary))' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Viewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{peakViewers}</div>
            <p className="text-xs text-muted-foreground">Concurrent viewers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">Unique viewers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From tips</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Watch Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgViewDuration}m</div>
            <p className="text-xs text-muted-foreground">Per viewer</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="viewership" className="space-y-4">
        <TabsList>
          <TabsTrigger value="viewership">Viewership</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="viewership" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Viewer Timeline</CardTitle>
              <CardDescription>Concurrent viewers over time (5-minute intervals)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={viewershipData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="viewers" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Viewers"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Reaction Breakdown</CardTitle>
                <CardDescription>Total reactions by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={engagementChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {engagementChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Stats</CardTitle>
                <CardDescription>Overall engagement metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">Hearts</span>
                  </div>
                  <span className="text-2xl font-bold">{engagement.hearts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Claps</span>
                  </div>
                  <span className="text-2xl font-bold">{engagement.claps}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Reactions</span>
                  <span className="text-2xl font-bold">{engagement.hearts + engagement.claps}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Timeline</CardTitle>
              <CardDescription>Tips received during stream</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" name="Amount ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
