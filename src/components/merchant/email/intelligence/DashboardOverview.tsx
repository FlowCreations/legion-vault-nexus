import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Mail, TrendingUp, Users, Loader2, Send, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchWithCache } from "@/utils/cacheHelper";

export const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({
    totalSent: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
    totalRevenue: 0,
  });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Use aggressive caching - 5 min cache for dashboard
      const [campaignsData, insightsData] = await Promise.all([
        fetchWithCache('email-campaigns-stats-v2', async () => {
          const { data } = await supabase
            .from("email_campaigns")
            .select("analytics");
          return data;
        }, 5 * 60 * 1000),
        fetchWithCache('ai-email-insights-v2', async () => {
          const { data } = await supabase
            .from("ai_email_insights")
            .select("insight_title, insight_description, confidence_score, created_at")
            .order("created_at", { ascending: false })
            .limit(10);
          return data;
        }, 5 * 60 * 1000)
      ]);

      // Process campaign stats
      let totalSent = 0;
      let totalOpen = 0;
      let totalClick = 0;
      let totalRev = 0;

      campaignsData?.forEach((c: any) => {
        const a = c.analytics as any;
        totalSent += a?.totalSent || 0;
        totalOpen += a?.totalOpened || 0;
        totalClick += a?.totalClicked || 0;
      });

      setStats({
        totalSent,
        avgOpenRate: totalSent > 0 ? (totalOpen / totalSent) * 100 : 0,
        avgClickRate: totalSent > 0 ? (totalClick / totalSent) * 100 : 0,
        totalRevenue: totalRev,
      });

      setRecommendations(insightsData?.map((i: any) => ({
        title: i.insight_title,
        description: i.insight_description,
        confidence_score: i.confidence_score || 0,
        created_at: i.created_at
      })) || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      setGenerating(true);
      
      const { data, error } = await supabase.functions.invoke("generate-realtime-recommendations");
      
      if (error) {
        console.error("Recommendations error:", error);
        throw new Error(error.message || "Failed to generate recommendations");
      }

      toast({
        title: "Recommendations Generated",
        description: "AI has analyzed your subscriber behavior and generated new recommendations.",
      });

      // Reload data after short delay to ensure processing is complete
      setTimeout(() => loadData(), 1000);
    } catch (error: any) {
      console.error("Full error:", error);
      toast({
        title: "Error Generating Recommendations",
        description: error.message || "There was an error generating recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
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
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</span>
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
              <span className="text-2xl font-bold">{stats.avgOpenRate.toFixed(1)}%</span>
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
              <Send className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{stats.avgClickRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>AI-Powered Recommendations</CardTitle>
            </div>
            <Button onClick={generateRecommendations} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Generate New
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {recommendations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recommendations yet. Click "Generate New" to analyze your audience.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <Card key={rec.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <Badge variant="secondary">
                          {(rec.confidence_score * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline">PTP: {rec.ptp_score}</Badge>
                        <Badge variant="outline">{rec.era_label}</Badge>
                        <Badge variant="outline">{rec.recommendation_type}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};