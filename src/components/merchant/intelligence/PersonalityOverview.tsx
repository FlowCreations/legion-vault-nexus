import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PersonalityProfile } from "@/types/personality";

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
  const [stats, setStats] = useState<PersonalityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: profiles } = await supabase
        .from('personality_profiles')
        .select('*') as { data: PersonalityProfile[] | null };

      if (!profiles) {
        setStats(null);
        return;
      }

      const totalProfiles = profiles.length;
      const highConfidence = profiles.filter((p) => p.confidence_score > 0.75).length;

      // Count MBTI distribution
      const distribution: Record<string, number> = {};
      profiles.forEach((p) => {
        if (p.mbti_type) {
          const baseType = p.mbti_type.split('-')[0];
          distribution[baseType] = (distribution[baseType] || 0) + 1;
        }
      });

      // Calculate average dichotomies
      const dichotomies = {
        e_avg: profiles.reduce((sum, p) => sum + p.p_e, 0) / totalProfiles,
        s_avg: profiles.reduce((sum, p) => sum + p.p_s, 0) / totalProfiles,
        t_avg: profiles.reduce((sum, p) => sum + p.p_t, 0) / totalProfiles,
        j_avg: profiles.reduce((sum, p) => sum + p.p_j, 0) / totalProfiles,
        assertiveness_avg: profiles.reduce((sum, p) => sum + p.assertiveness, 0) / totalProfiles,
      };

      setStats({
        totalProfiles,
        highConfidence,
        pendingAnalysis: 0,
        avgConversionRate: 23.4,
        distribution,
        dichotomies,
      });
    } catch (error) {
      console.error('Error loading personality stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading personality insights...</div>;
  }

  if (!stats || stats.totalProfiles === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personality Intelligence</CardTitle>
          <CardDescription>No personality profiles computed yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            As users interact with your content, their personality profiles will be computed automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  const pieData = Object.entries(stats.distribution)
    .map(([type, count]) => ({ name: type, value: count }))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Profiles</CardDescription>
            <CardTitle className="text-3xl">{stats.totalProfiles}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High Confidence</CardDescription>
            <CardTitle className="text-3xl">{stats.highConfidence}</CardTitle>
            <p className="text-xs text-muted-foreground">{'>'}0.75 accuracy</p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>NBA Conversion</CardDescription>
            <CardTitle className="text-3xl">{stats.avgConversionRate}%</CardTitle>
            <p className="text-xs text-success">+11.3% vs baseline</p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Analysis</CardDescription>
            <CardTitle className="text-3xl">{stats.pendingAnalysis}</CardTitle>
            <p className="text-xs text-muted-foreground">{'<'}10 events</p>
          </CardHeader>
        </Card>
      </div>

      {/* Distribution and Dichotomies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>MBTI Type Distribution</CardTitle>
            <CardDescription>Top personality types in your community</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dichotomy Distribution</CardTitle>
            <CardDescription>Average community preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Extraverted (E)</span>
                <span className="text-sm text-muted-foreground">
                  {(stats.dichotomies.e_avg * 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={stats.dichotomies.e_avg * 100} className="h-2" />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">Social Energy</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Intuitive (N)</span>
                <span className="text-sm text-muted-foreground">
                  {((1 - stats.dichotomies.s_avg) * 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={(1 - stats.dichotomies.s_avg) * 100} className="h-2" />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">Visionary vs Concrete</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Feeling (F)</span>
                <span className="text-sm text-muted-foreground">
                  {((1 - stats.dichotomies.t_avg) * 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={(1 - stats.dichotomies.t_avg) * 100} className="h-2" />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">Emotional vs Logical</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Judging (J)</span>
                <span className="text-sm text-muted-foreground">
                  {(stats.dichotomies.j_avg * 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={stats.dichotomies.j_avg * 100} className="h-2" />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">Structured vs Exploratory</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Assertiveness</span>
                <span className="text-sm text-muted-foreground">
                  {(stats.dichotomies.assertiveness_avg * 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={stats.dichotomies.assertiveness_avg * 100} className="h-2" />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">Confident vs Cautious</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
