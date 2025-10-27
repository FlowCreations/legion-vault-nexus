import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Mail, MousePointer, DollarSign, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CampaignAnalyticsProps {
  campaignId: string;
}

export function CampaignAnalytics({ campaignId }: CampaignAnalyticsProps) {
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCampaignData();
  }, [campaignId]);

  const loadCampaignData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (data) {
      setCampaign(data);
      
      // If no analytics yet, compute them
      if (!data.analytics || Object.keys(data.analytics).length === 0) {
        await computeStats();
      }
    }
    setLoading(false);
  };

  const computeStats = async () => {
    setRefreshing(true);
    try {
      await supabase.functions.invoke("compute-campaign-stats", {
        body: { campaignId },
      });
      await loadCampaignData();
      toast({ title: "Analytics updated" });
    } catch (error) {
      toast({ title: "Error updating analytics", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (!campaign) {
    return <div className="text-center py-8">Campaign not found</div>;
  }

  const analytics = campaign.analytics || {};
  const benchmarks = {
    openRate: 22, // Music industry average
    clickRate: 2.5,
    clickToOpenRate: 12,
  };

  // Prepare timeline data
  const timelineData = [];
  if (analytics.timeline) {
    for (let hour = 0; hour < 24; hour++) {
      timelineData.push({
        hour: `${hour}:00`,
        opens: analytics.timeline.opens?.[hour] || 0,
        clicks: analytics.timeline.clicks?.[hour] || 0,
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{campaign.name}</h2>
          <p className="text-muted-foreground">
            {campaign.status === "sent" ? `Sent ${new Date(campaign.sent_at).toLocaleDateString()}` : campaign.status}
          </p>
        </div>
        <Button onClick={computeStats} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Stats
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sent</span>
          </div>
          <p className="text-2xl font-bold">{analytics.totalSent || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {analytics.deliveryRate || 0}% delivered
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Open Rate</span>
          </div>
          <p className="text-2xl font-bold">{analytics.openRate || 0}%</p>
          <div className="flex items-center gap-1 mt-1">
            <Badge
              variant={
                (analytics.openRate || 0) > benchmarks.openRate ? "default" : "secondary"
              }
              className="text-xs"
            >
              Benchmark: {benchmarks.openRate}%
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MousePointer className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Click Rate</span>
          </div>
          <p className="text-2xl font-bold">{analytics.clickRate || 0}%</p>
          <div className="flex items-center gap-1 mt-1">
            <Badge
              variant={
                (analytics.clickRate || 0) > benchmarks.clickRate ? "default" : "secondary"
              }
              className="text-xs"
            >
              Benchmark: {benchmarks.clickRate}%
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">CTOR</span>
          </div>
          <p className="text-2xl font-bold">{analytics.clickToOpenRate || 0}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click-to-open rate
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Conversions</span>
          </div>
          <p className="text-2xl font-bold">-</p>
          <p className="text-xs text-muted-foreground mt-1">
            Coming soon
          </p>
        </Card>
      </div>

      {/* Timeline Chart */}
      {timelineData.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Engagement Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="opens" stroke="hsl(var(--primary))" name="Opens" />
              <Line type="monotone" dataKey="clicks" stroke="hsl(var(--chart-2))" name="Clicks" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Campaign Details */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Campaign Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Campaign Goal</p>
            <p className="font-medium capitalize">{campaign.campaign_goal || "Not set"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Subject Line</p>
            <p className="font-medium">{campaign.subject}</p>
          </div>
          {campaign.ai_generated && (
            <div className="col-span-2">
              <Badge variant="secondary">🤖 AI Generated Content</Badge>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
