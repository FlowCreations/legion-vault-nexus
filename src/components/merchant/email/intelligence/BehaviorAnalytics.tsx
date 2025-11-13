import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const PTP_COLORS = {
  green: "hsl(142 71% 45%)",
  yellow: "hsl(48 96% 53%)",
  red: "hsl(0 84% 60%)"
};

const ERA_COLORS = {
  Discover: "hsl(262 83% 58%)",
  Engage: "hsl(217 91% 60%)",
  Invest: "hsl(142 71% 45%)",
  Loyal: "hsl(48 96% 53%)"
};

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

      const { data: profiles } = await supabase
        .from("era_ptp_scores_daily")
        .select("ptp, era_components")
        .order("date", { ascending: false })
        .limit(1000);

      if (profiles && profiles.length > 0) {
        const greenZone = profiles.filter(p => (p.ptp || 0) >= 67).length;
        const yellowZone = profiles.filter(p => (p.ptp || 0) >= 34 && (p.ptp || 0) < 67).length;
        const redZone = profiles.filter(p => (p.ptp || 0) < 34).length;

        setPtpDistribution([
          { name: "Green (67-100)", value: greenZone, color: PTP_COLORS.green },
          { name: "Yellow (34-66)", value: yellowZone, color: PTP_COLORS.yellow },
          { name: "Red (0-33)", value: redZone, color: PTP_COLORS.red },
        ]);

        const eraGroups = profiles.reduce((acc: any, p) => {
          const eraScore = p.era_components ? (p.era_components as any).era_score || 0 : 0;
          const era = eraScore >= 75 ? "Loyal" : eraScore >= 50 ? "Invest" : eraScore >= 25 ? "Engage" : "Discover";
          acc[era] = (acc[era] || 0) + 1;
          return acc;
        }, {});

        setEraDistribution(
          Object.entries(eraGroups).map(([name, value]) => ({ 
            name, 
            value,
            color: ERA_COLORS[name as keyof typeof ERA_COLORS]
          }))
        );
      }

      const { data: campaigns } = await supabase
        .from("email_campaigns")
        .select("*")
        .eq("status", "sent");

      const { data: sends } = await supabase
        .from("email_sends")
        .select("*, user_profiles!inner(user_id)");

      if (sends && sends.length > 0 && campaigns) {
        const userIds = sends.map((s: any) => s.user_profiles?.user_id).filter(Boolean);
        
        if (userIds.length > 0) {
          const { data: eraScores } = await supabase
            .from("era_ptp_scores_daily")
            .select("member_id, era_components")
            .in("member_id", userIds)
            .order("date", { ascending: false });

          const eraMap = new Map();
          eraScores?.forEach(score => {
            if (!eraMap.has(score.member_id)) {
              const eraScore = score.era_components ? (score.era_components as any).era_score || 0 : 0;
              const era = eraScore >= 75 ? "Loyal" : eraScore >= 50 ? "Invest" : eraScore >= 25 ? "Engage" : "Discover";
              eraMap.set(score.member_id, era);
            }
          });

          const performanceByEra = sends.reduce((acc: any, send: any) => {
            const userId = send.user_profiles?.user_id;
            const era = userId ? eraMap.get(userId) || "Unknown" : "Unknown";
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
              openRate: item.sent > 0 ? ((item.opened / item.sent) * 100).toFixed(1) : 0,
            }))
          );
        }
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
    <div className="grid gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              PTP Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ptpDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ptpDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {ptpDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No PTP data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              ERA Label Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eraDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eraDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {eraDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No ERA data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Campaign Performance by ERA Label
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaignPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={campaignPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="era" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Open Rate %', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                />
                <Bar 
                  dataKey="openRate" 
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <p>No campaign performance data available</p>
                <p className="text-sm">Send some campaigns to see analytics here</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
