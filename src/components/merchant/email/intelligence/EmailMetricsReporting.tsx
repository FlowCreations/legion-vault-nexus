import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BarChart3, TrendingUp, Mail } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export const EmailMetricsReporting = () => {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      const { data } = await supabase
        .from("email_campaigns")
        .select("*")
        .eq("status", "sent")
        .order("sent_at", { ascending: false });

      if (data) {
        setCampaigns(data);

        // Create timeline data
        const timeline = data.map((campaign: any) => ({
          name: campaign.name.substring(0, 20),
          openRate: campaign.analytics?.openRate || 0,
          clickRate: campaign.analytics?.clickRate || 0,
          sent: campaign.analytics?.totalSent || 0,
        }));

        setTimelineData(timeline);
      }
    } catch (error: any) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{campaigns.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Open Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">
                {(
                  campaigns.reduce((sum, c) => sum + (c.analytics?.openRate || 0), 0) /
                  (campaigns.length || 1)
                ).toFixed(1)}
                %
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Click Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">
                {(
                  campaigns.reduce((sum, c) => sum + (c.analytics?.clickRate || 0), 0) /
                  (campaigns.length || 1)
                ).toFixed(1)}
                %
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Campaign Performance Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="openRate"
                stroke="hsl(var(--primary))"
                name="Open Rate %"
              />
              <Line
                type="monotone"
                dataKey="clickRate"
                stroke="hsl(var(--secondary))"
                name="Click Rate %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Campaign List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-semibold">{campaign.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Sent: {new Date(campaign.sent_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    Open: {campaign.analytics?.openRate?.toFixed(1) || 0}%
                  </p>
                  <p className="text-sm">
                    Click: {campaign.analytics?.clickRate?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};