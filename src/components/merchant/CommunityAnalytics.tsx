import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, Activity, Globe, DollarSign, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CommunityAnalytics {
  date: string;
  total_members: number;
  new_members_today: number;
  active_members_7d: number;
  active_members_30d: number;
  tier_free: number;
  tier_rebels: number;
  tier_outlaws: number;
  tier_legionnaires: number;
  avg_engagement_score: number;
  total_posts: number;
  total_messages: number;
  countries_represented: number;
  top_country: string;
  top_region: string;
  total_mrr: number;
  avg_lifetime_value: number;
}

export function CommunityAnalytics() {
  const [analytics, setAnalytics] = useState<CommunityAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/community-analytics');
      if (!response.ok) throw new Error('Failed to load analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      
      // Fallback: compute analytics if not available
      await computeAnalytics();
    } finally {
      setLoading(false);
    }
  };

  const computeAnalytics = async () => {
    setComputing(true);
    try {
      const { error } = await supabase.functions.invoke('compute-community-analytics');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Community analytics updated",
      });
      
      await loadAnalytics();
    } catch (error) {
      console.error('Error computing analytics:', error);
      toast({
        title: "Error",
        description: "Failed to compute analytics",
        variant: "destructive",
      });
    } finally {
      setComputing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const latestData = analytics[0];
  const tierData = latestData ? [
    { name: 'Free', value: latestData.tier_free, color: '#9CA3AF' },
    { name: 'Rebels', value: latestData.tier_rebels, color: '#EF4444' }, // red-500
    { name: 'Outlaws', value: latestData.tier_outlaws, color: '#A855F7' }, // purple-500
    { name: 'Legionnaires', value: latestData.tier_legionnaires, color: '#F59E0B' }, // amber-500
  ].filter(d => d.value > 0) : [];

  const growthData = analytics.slice(0, 7).reverse().map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    members: d.total_members,
    active: d.active_members_7d,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Community Analytics</h2>
          <p className="text-sm text-muted-foreground">Real-time metrics synced from Heartbeat</p>
        </div>
        <Button onClick={computeAnalytics} disabled={computing}>
          {computing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Update Analytics
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestData?.total_members.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{latestData?.new_members_today || 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active (7d)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestData?.active_members_7d.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {latestData ? Math.round((latestData.active_members_7d / latestData.total_members) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Reach</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestData?.countries_represented || 0}</div>
            <p className="text-xs text-muted-foreground">
              countries represented
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${latestData?.total_mrr?.toFixed(0) || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${latestData?.avg_lifetime_value?.toFixed(2) || 0} avg LTV
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Member Growth</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="members" stroke="hsl(var(--primary))" strokeWidth={2} name="Total Members" />
                <Line type="monotone" dataKey="active" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Active (7d)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tier Distribution</CardTitle>
            <CardDescription>Current membership tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Community Engagement</CardTitle>
            <CardDescription>Posts and messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Total Posts</span>
                <span className="text-2xl font-bold">{latestData?.total_posts || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Total Messages</span>
                <span className="text-2xl font-bold">{latestData?.total_messages || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Avg Engagement Score</span>
                <span className="text-2xl font-bold">{latestData?.avg_engagement_score?.toFixed(1) || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
            <CardDescription>Most active regions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Top Country</span>
                <span className="text-lg font-bold">{latestData?.top_country || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Top Region</span>
                <span className="text-lg font-bold">{latestData?.top_region || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Countries</span>
                <span className="text-lg font-bold">{latestData?.countries_represented || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
