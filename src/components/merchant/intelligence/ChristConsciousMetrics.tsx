import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Heart, TrendingUp, ShieldCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ChristConsciousMetrics {
  loveFirstScore: number;
  empowermentLanguageFrequency: number;
  manipulationDetections: number;
  ethosAlignedConversionRate: number;
  traditionalConversionRate: number;
  totalCampaigns: number;
  ethosAlignedCampaigns: number;
}

export function ChristConsciousMetrics() {
  const [metrics, setMetrics] = useState<ChristConsciousMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data: campaigns } = await supabase
        .from('email_campaigns')
        .select('ethos_score, love_first_validation, manipulation_flags, analytics');

      if (!campaigns) {
        setLoading(false);
        return;
      }

      const totalCampaigns = campaigns.length;
      const ethosAlignedCampaigns = campaigns.filter(c => c.love_first_validation).length;
      
      // Calculate average ethos score
      const avgEthosScore = campaigns.reduce((sum, c) => sum + (c.ethos_score || 0), 0) / totalCampaigns || 0;
      
      // Calculate manipulation detections
      const totalManipulations = campaigns.reduce((sum, c) => sum + (c.manipulation_flags || 0), 0);
      
      // Calculate conversion rates
      const ethosAlignedCampaignsData = campaigns.filter(c => c.love_first_validation && c.analytics);
      const traditionalCampaignsData = campaigns.filter(c => !c.love_first_validation && c.analytics);
      
      const avgEthosConversion = ethosAlignedCampaignsData.length > 0
        ? ethosAlignedCampaignsData.reduce((sum, c) => {
            const analytics = c.analytics as any;
            return sum + (parseFloat(analytics?.conversion_rate) || 0);
          }, 0) / ethosAlignedCampaignsData.length
        : 0;

      const avgTraditionalConversion = traditionalCampaignsData.length > 0
        ? traditionalCampaignsData.reduce((sum, c) => {
            const analytics = c.analytics as any;
            return sum + (parseFloat(analytics?.conversion_rate) || 0);
          }, 0) / traditionalCampaignsData.length
        : 0;

      setMetrics({
        loveFirstScore: avgEthosScore,
        empowermentLanguageFrequency: ethosAlignedCampaigns / totalCampaigns * 100,
        manipulationDetections: totalManipulations,
        ethosAlignedConversionRate: avgEthosConversion,
        traditionalConversionRate: avgTraditionalConversion,
        totalCampaigns,
        ethosAlignedCampaigns
      });

    } catch (error) {
      console.error('Error fetching Christ-conscious metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No campaign data available yet</p>
        </CardContent>
      </Card>
    );
  }

  const comparisonData = [
    {
      name: 'Christ-Conscious',
      conversion: metrics.ethosAlignedConversionRate
    },
    {
      name: 'Traditional',
      conversion: metrics.traditionalConversionRate
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          Christ-Conscious Performance
        </h2>
        <p className="text-muted-foreground mt-1">
          Track how love-first messaging impacts your campaigns
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Love-First Score
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.loveFirstScore.toFixed(0)}/100</div>
            <Progress value={metrics.loveFirstScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Average ethos alignment across campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Empowerment Rate
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.empowermentLanguageFrequency.toFixed(0)}%</div>
            <Progress value={metrics.empowermentLanguageFrequency} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.ethosAlignedCampaigns} of {metrics.totalCampaigns} campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Manipulation Flags
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.manipulationDetections}</div>
            <Badge variant={metrics.manipulationDetections === 0 ? "default" : "destructive"} className="mt-2">
              {metrics.manipulationDetections === 0 ? "Clean" : "Needs Review"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Scarcity/pressure tactics detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Lift
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.ethosAlignedConversionRate > 0 && metrics.traditionalConversionRate > 0
                ? `+${((metrics.ethosAlignedConversionRate / metrics.traditionalConversionRate - 1) * 100).toFixed(0)}%`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Christ-conscious vs traditional
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate Comparison</CardTitle>
          <CardDescription>
            Christ-conscious messaging vs traditional marketing approaches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Conversion %', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="conversion" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            ✨ <strong>Authentic connection drives results:</strong> Christ-conscious campaigns show{' '}
            {metrics.ethosAlignedConversionRate > metrics.traditionalConversionRate ? 'higher' : 'comparable'} conversion rates
            without manipulation tactics.
          </p>
          <p>
            💪 <strong>Empowerment builds loyalty:</strong> Fans respond when you honor their autonomy and speak truth.
          </p>
          <p>
            🌟 <strong>Long-term impact:</strong> Love-first messaging creates deeper brand loyalty and reduces unsubscribes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
