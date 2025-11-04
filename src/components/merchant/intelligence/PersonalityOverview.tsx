import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PersonalityProfile } from "@/types/personality";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PersonalityStats {
  totalProfiles: number;
  highConfidence: number;
  pendingAnalysis: number;
  avgConversionRate: number;
  distribution: Record<string, number>;
  dichotomies: {
    e_avg: number;
    s_avg: number;
    t_avg: number;
    j_avg: number;
    assertiveness_avg: number;
  };
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const PersonalityOverview = () => {
  const [stats, setStats] = useState<PersonalityStats>({
    totalProfiles: 0,
    highConfidence: 0,
    pendingAnalysis: 0,
    avgConversionRate: 0,
    distribution: {},
    dichotomies: {
      e_avg: 0.5,
      s_avg: 0.5,
      t_avg: 0.5,
      j_avg: 0.5,
      assertiveness_avg: 0.5,
    },
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const generatePersonalities = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-generate-personalities');
      
      if (error) throw error;

      toast({
        title: "Success",
        description: `Generated ${data.generated} personality profiles for Heartbeat members`,
      });

      fetchStats();
    } catch (error) {
      console.error('Error generating personalities:', error);
      toast({
        title: "Error",
        description: "Failed to generate personality profiles",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('personality_profiles')
        .select('*');

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate statistics
      const totalProfiles = profiles.length;
      const highConfidence = profiles.filter(p => p.confidence_score >= 0.7).length;
      const pendingAnalysis = profiles.filter(p => !p.mbti_type).length;

      // Calculate type distribution
      const distribution: Record<string, number> = {};
      profiles.forEach(p => {
        if (p.mbti_type) {
          const baseType = p.mbti_type.split('-')[0];
          distribution[baseType] = (distribution[baseType] || 0) + 1;
        }
      });

      // Calculate average dichotomies
      const dichotomies = {
        e_avg: profiles.reduce((sum, p) => sum + (p.p_e || 0.5), 0) / totalProfiles,
        s_avg: profiles.reduce((sum, p) => sum + (p.p_s || 0.5), 0) / totalProfiles,
        t_avg: profiles.reduce((sum, p) => sum + (p.p_t || 0.5), 0) / totalProfiles,
        j_avg: profiles.reduce((sum, p) => sum + (p.p_j || 0.5), 0) / totalProfiles,
        assertiveness_avg: profiles.reduce((sum, p) => sum + (p.assertiveness || 0.5), 0) / totalProfiles,
      };

      setStats({
        totalProfiles,
        highConfidence,
        pendingAnalysis,
        avgConversionRate: 0, // TODO: Calculate from actual conversion data
        distribution,
        dichotomies,
      });
    } catch (error) {
      console.error('Error fetching personality stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (stats.totalProfiles === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personality Intelligence</CardTitle>
          <CardDescription>No personality data yet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate personality profiles for your Heartbeat members to enable AI-powered engagement.
          </p>
          <Button 
            onClick={generatePersonalities} 
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Profiles...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Personality Profiles
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const chartData = Object.entries(stats.distribution).map(([type, count]) => ({
    name: type,
    value: count,
  })).slice(0, 5); // Top 5 types

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Personality Intelligence</CardTitle>
              <CardDescription>Member personality insights</CardDescription>
            </div>
            <Button 
              onClick={generatePersonalities} 
              disabled={generating}
              size="sm"
              variant="outline"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Update
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">{stats.totalProfiles}</div>
              <div className="text-sm text-muted-foreground">Total Profiles</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.highConfidence}</div>
              <div className="text-sm text-muted-foreground">High Confidence</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.pendingAnalysis}</div>
              <div className="text-sm text-muted-foreground">Pending Analysis</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Math.round((stats.highConfidence / stats.totalProfiles) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Type Distribution</CardTitle>
          <CardDescription>Top personality types</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Not enough data yet
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Average Personality Traits</CardTitle>
          <CardDescription>Aggregate traits across all members</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Extraversion</span>
              <span className="text-sm font-medium">{Math.round(stats.dichotomies.e_avg * 100)}%</span>
            </div>
            <Progress value={stats.dichotomies.e_avg * 100} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Sensing</span>
              <span className="text-sm font-medium">{Math.round(stats.dichotomies.s_avg * 100)}%</span>
            </div>
            <Progress value={stats.dichotomies.s_avg * 100} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Thinking</span>
              <span className="text-sm font-medium">{Math.round(stats.dichotomies.t_avg * 100)}%</span>
            </div>
            <Progress value={stats.dichotomies.t_avg * 100} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Judging</span>
              <span className="text-sm font-medium">{Math.round(stats.dichotomies.j_avg * 100)}%</span>
            </div>
            <Progress value={stats.dichotomies.j_avg * 100} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Assertiveness</span>
              <span className="text-sm font-medium">{Math.round(stats.dichotomies.assertiveness_avg * 100)}%</span>
            </div>
            <Progress value={stats.dichotomies.assertiveness_avg * 100} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
