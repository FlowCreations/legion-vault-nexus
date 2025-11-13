import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, Users, Target } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export const BehaviorAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [ptpDistribution, setPtpDistribution] = useState<any[]>([]);
  const [eraDistribution, setEraDistribution] = useState<any[]>([]);
  const [campaignPerformance, setCampaignPerformance] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get PTP score distribution
      const { data: profiles } = await supabase
        .from("era_ptp_scores_daily")
        .select("ptp_score, era_label")
        .order("score_date", { ascending: false })
        .limit(1000);

      if (profiles) {
        // PTP Distribution (Green/Yellow/Red zones)
        const greenZone = profiles.filter(p => (p.ptp_score || 0) >= 67).length;
        const yellowZone = profiles.filter(p => (p.ptp_score || 0) >= 34 && (p.ptp_score || 0) < 67).length;
        const redZone = profiles.filter(p => (p.ptp_score || 0) < 34).length;

        setPtpDistribution([
          { name: "Green (67-100)", value: greenZone, color: "#22c55e" },
          { name: "Yellow (34-66)", value: yellowZone, color: "#eab308" },
          { name: "Red (0-33)", value: redZone, color: "#ef4444" },
        ]);

        // ERA Distribution
        const eraGroups = profiles.reduce((acc: any, p) => {
          const era = p.era_label || "Discover";
          acc[era] = (acc[era] || 0) + 1;
          return acc;
        }, {});

        setEraDistribution(
          Object.entries(eraGroups).map(([name, value]) => ({ name, value }))
        );
      }

      // Get campaign performance by ERA label
      const { data: campaigns } = await supabase
        .from("email_campaigns")
        .select("*")
        .eq("status", "sent");

      const { data: sends } = await supabase
        .from("email_sends")
        .select("*, user_profiles(era_label)");

      if (sends && campaigns) {
        const performanceByEra = sends.reduce((acc: any, send: any) => {
          const era = send.user_profiles?.era_label || "Unknown";
          if (!acc[era]) {
            acc[era] = { era, sent: 0, opened: 0, clicked: 0 };
          }
          acc[era].sent++;
          if (send.opened_at) acc[era].opened++;
          if (send.clicked_at) acc[era].clicked++;
          return acc;
        }, {});

        setCampaignPerformance(
          Object.values(performanceByEra).map((item: any) => ({
            ...item,
            openRate: item.sent > 0 ? (item.opened / item.sent) * 100 : 0,
            clickRate: item.sent > 0 ? (item.clicked / item.sent) * 100 : 0,
          }))
        );
      }
    } catch (error: any) {
      console.error("Error loading analytics:", error);
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
      <div className="grid grid-cols-2 gap-6">
        {/* PTP Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              PTP Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ptpDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ptpDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ERA Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              ERA Label Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eraDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {eraDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance by ERA Label */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Campaign Performance by ERA Label
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={campaignPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="era" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="openRate" fill="hsl(var(--primary))" name="Open Rate %" />
              <Bar dataKey="clickRate" fill="hsl(var(--secondary))" name="Click Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};