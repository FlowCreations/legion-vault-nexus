import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Mail, 
  BarChart3, 
  Lightbulb,
  RefreshCw,
  Target,
  Zap,
  Clock
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SmartCampaignRecommender } from "./SmartCampaignRecommender";
import { TunepipeSyncButton } from "./TunepipeSyncButton";

export const AIEmailIntelligence = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [subscriberStats, setSubscriberStats] = useState<any>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [showRecommender, setShowRecommender] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCampaigns(),
        loadInsights(),
        loadSubscriberStats(),
        loadLastSync()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!error && data) {
      setCampaigns(data);
    }
  };

  const loadInsights = async () => {
    const { data, error } = await supabase
      .from('ai_email_insights')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!error && data) {
      setInsights(data);
    }
  };

  const loadSubscriberStats = async () => {
    // Get total subscribers
    const { count: totalSubscribers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    
    // Get engagement distribution
    const { data: sends } = await supabase
      .from('email_sends')
      .select('user_id, opened_at, clicked_at');
    
    const engagementLevels = {
      superEngaged: 0,
      active: 0,
      passive: 0,
      inactive: 0
    };
    
    // Calculate engagement rates per user
    const userEngagement = new Map<string, { opens: number, total: number }>();
    
    sends?.forEach(send => {
      if (!send.user_id) return;
      
      const stats = userEngagement.get(send.user_id) || { opens: 0, total: 0 };
      stats.total++;
      if (send.opened_at) stats.opens++;
      userEngagement.set(send.user_id, stats);
    });
    
    userEngagement.forEach(stats => {
      const openRate = (stats.opens / stats.total) * 100;
      if (openRate > 40) engagementLevels.superEngaged++;
      else if (openRate >= 20) engagementLevels.active++;
      else if (openRate > 0) engagementLevels.passive++;
      else engagementLevels.inactive++;
    });
    
    setSubscriberStats({
      total: totalSubscribers || 0,
      distribution: engagementLevels
    });
  };

  const loadLastSync = async () => {
    const { data } = await supabase
      .from('api_sync_logs')
      .select('completed_at')
      .eq('api_name', 'tunepipe')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data?.completed_at) {
      setLastSync(data.completed_at);
    }
  };

  const refreshInsights = async () => {
    setRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke('generate-email-insights');
      
      if (error) throw error;
      
      toast.success('AI insights refreshed');
      await loadInsights();
    } catch (error: any) {
      toast.error('Failed to refresh insights');
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  const calculateOverallMetrics = () => {
    if (campaigns.length === 0) return { avgOpen: 0, avgClick: 0, avgCTOR: 0 };
    
    let totalOpen = 0;
    let totalClick = 0;
    let totalCTOR = 0;
    let count = 0;
    
    campaigns.forEach(c => {
      if (c.analytics?.open_rate) {
        totalOpen += parseFloat(c.analytics.open_rate);
        count++;
      }
      if (c.analytics?.click_rate) {
        totalClick += parseFloat(c.analytics.click_rate);
      }
      if (c.analytics?.ctor) {
        totalCTOR += parseFloat(c.analytics.ctor);
      }
    });
    
    return {
      avgOpen: count > 0 ? (totalOpen / count).toFixed(1) : 0,
      avgClick: count > 0 ? (totalClick / count).toFixed(1) : 0,
      avgCTOR: count > 0 ? (totalCTOR / count).toFixed(1) : 0
    };
  };

  const metrics = calculateOverallMetrics();

  const engagementData = subscriberStats?.distribution ? [
    { name: 'Super Engaged', value: subscriberStats.distribution.superEngaged, color: '#22c55e' },
    { name: 'Active', value: subscriberStats.distribution.active, color: '#3b82f6' },
    { name: 'Passive', value: subscriberStats.distribution.passive, color: '#f59e0b' },
    { name: 'Inactive', value: subscriberStats.distribution.inactive, color: '#ef4444' }
  ] : [];

  return (
    <div className="space-y-6">
      {showRecommender ? (
        <div>
          <Button variant="outline" onClick={() => setShowRecommender(false)} className="mb-4">
            ← Back to Intelligence
          </Button>
          <SmartCampaignRecommender onClose={() => setShowRecommender(false)} />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Email Intelligence</h2>
              <p className="text-muted-foreground mt-1">
                AI-powered insights from Tunepipe data
              </p>
            </div>
            <div className="flex gap-2">
              <TunepipeSyncButton onSyncComplete={loadData} />
              <Button onClick={refreshInsights} variant="outline" disabled={refreshing}>
                {refreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                <span className="ml-2">Refresh Insights</span>
              </Button>
              <Button onClick={() => setShowRecommender(true)}>
                <Target className="h-4 w-4 mr-2" />
                Smart Campaign
              </Button>
            </div>
          </div>

          {/* Last Sync Info */}
          {lastSync && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Last synced: {new Date(lastSync).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscriberStats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">Active contacts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgOpen}%</div>
                <p className="text-xs text-muted-foreground">
                  {parseFloat(metrics.avgOpen as string) > 25 ? '↑ Above average' : '↓ Below industry avg (25%)'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Click Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgClick}%</div>
                <p className="text-xs text-muted-foreground">
                  {parseFloat(metrics.avgClick as string) > 3 ? '↑ Strong engagement' : '↓ Below industry avg (3%)'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CTOR</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgCTOR}%</div>
                <p className="text-xs text-muted-foreground">Click-to-open rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Distribution */}
          {engagementData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Subscriber Engagement Distribution</CardTitle>
                <CardDescription>How engaged your audience is</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={engagementData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    AI-Powered Insights
                  </CardTitle>
                  <CardDescription>Actionable recommendations based on your data</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No insights yet. Sync Tunepipe data to generate insights.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <div key={insight.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold flex items-center gap-2">
                            {insight.insight_title}
                            <Badge variant="secondary">{insight.insight_type}</Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.insight_description}
                          </p>
                        </div>
                        {insight.confidence_score && (
                          <Badge variant="outline">
                            {(insight.confidence_score * 100).toFixed(0)}% confidence
                          </Badge>
                        )}
                      </div>
                      {insight.actionable_steps && (
                        <div className="mt-3 pl-4 border-l-2 border-primary/20">
                          <p className="text-sm font-medium mb-1">Action Steps:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {(Array.isArray(insight.actionable_steps) ? insight.actionable_steps : []).map((step: string, i: number) => (
                              <li key={i}>• {step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Campaigns Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaign Performance</CardTitle>
              <CardDescription>Your latest email campaigns from Tunepipe</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No campaigns synced yet
                </p>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{campaign.name}</h4>
                          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                        </div>
                        <Badge>{campaign.status}</Badge>
                      </div>
                      {campaign.analytics && (
                        <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Sent</p>
                            <p className="text-sm font-medium">{campaign.analytics.sent || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Open Rate</p>
                            <p className="text-sm font-medium">{campaign.analytics.open_rate || 0}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Click Rate</p>
                            <p className="text-sm font-medium">{campaign.analytics.click_rate || 0}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">CTOR</p>
                            <p className="text-sm font-medium">{campaign.analytics.ctor || 0}%</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
