import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Brain, TrendingUp } from "lucide-react";
import { getPersonalityColor } from "@/lib/personalityRules";

interface PersonalityData {
  mbtiType: string;
  count: number;
  percentage: number;
  avgConfidence: number;
}

interface DimensionData {
  dimension: string;
  trait1: number;
  trait2: number;
}

export default function PersonalityBreakdown() {
  const [mbtiData, setMbtiData] = useState<PersonalityData[]>([]);
  const [dimensionData, setDimensionData] = useState<DimensionData[]>([]);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPersonalityData();
  }, []);

  const fetchPersonalityData = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('personality_profiles')
        .select('mbti_type, confidence_score, p_e, p_i, p_s, p_n, p_t, p_f, p_j, p_p')
        .not('mbti_type', 'is', null);

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        setLoading(false);
        return;
      }

      setTotalProfiles(profiles.length);

      // Group by MBTI type
      const mbtiGroups = profiles.reduce((acc, profile) => {
        const type = profile.mbti_type || 'Unknown';
        if (!acc[type]) {
          acc[type] = { count: 0, totalConfidence: 0 };
        }
        acc[type].count++;
        acc[type].totalConfidence += profile.confidence_score || 0;
        return acc;
      }, {} as Record<string, { count: number; totalConfidence: number }>);

      // Convert to array and calculate percentages
      const mbtiArray: PersonalityData[] = Object.entries(mbtiGroups)
        .map(([type, data]) => ({
          mbtiType: type,
          count: data.count,
          percentage: Math.round((data.count / profiles.length) * 100),
          avgConfidence: Math.round(data.totalConfidence / data.count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8); // Top 8 types

      setMbtiData(mbtiArray);

      // Calculate dimension averages
      const avgE = profiles.reduce((sum, p) => sum + (p.p_e || 0), 0) / profiles.length;
      const avgI = profiles.reduce((sum, p) => sum + (p.p_i || 0), 0) / profiles.length;
      const avgS = profiles.reduce((sum, p) => sum + (p.p_s || 0), 0) / profiles.length;
      const avgN = profiles.reduce((sum, p) => sum + (p.p_n || 0), 0) / profiles.length;
      const avgT = profiles.reduce((sum, p) => sum + (p.p_t || 0), 0) / profiles.length;
      const avgF = profiles.reduce((sum, p) => sum + (p.p_f || 0), 0) / profiles.length;
      const avgJ = profiles.reduce((sum, p) => sum + (p.p_j || 0), 0) / profiles.length;
      const avgP = profiles.reduce((sum, p) => sum + (p.p_p || 0), 0) / profiles.length;

      setDimensionData([
        { dimension: 'E/I', trait1: Math.round(avgE * 100), trait2: Math.round(avgI * 100) },
        { dimension: 'S/N', trait1: Math.round(avgS * 100), trait2: Math.round(avgN * 100) },
        { dimension: 'T/F', trait1: Math.round(avgT * 100), trait2: Math.round(avgF * 100) },
        { dimension: 'J/P', trait1: Math.round(avgJ * 100), trait2: Math.round(avgP * 100) },
      ]);

    } catch (error) {
      console.error('Error fetching personality data:', error);
    } finally {
      setLoading(false);
    }
  };

  const MBTI_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(var(--primary-glow))',
    '#6C8BEF',
    '#C68FE6',
    '#FF6B9D',
    '#FFB84D',
    '#4ECDC4',
  ];

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        Analyzing personality profiles...
      </div>
    );
  }

  if (totalProfiles === 0) {
    return (
      <Card className="p-8 text-center">
        <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">No Personality Data Yet</h3>
        <p className="text-muted-foreground">
          Personality profiles will appear here once members complete surveys or enough behavioral data is collected.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Total Profiles</h3>
          </div>
          <p className="text-3xl font-bold">{totalProfiles}</p>
          <p className="text-sm text-muted-foreground mt-1">Members analyzed</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <h3 className="font-semibold">Most Common Type</h3>
          </div>
          <p className="text-3xl font-bold">{mbtiData[0]?.mbtiType}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {mbtiData[0]?.percentage}% of members
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-5 w-5 text-primary-glow" />
            <h3 className="font-semibold">Avg Confidence</h3>
          </div>
          <p className="text-3xl font-bold">
            {Math.round(mbtiData.reduce((sum, d) => sum + d.avgConfidence, 0) / mbtiData.length)}%
          </p>
          <p className="text-sm text-muted-foreground mt-1">Prediction accuracy</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* MBTI Type Distribution */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            MBTI Type Distribution
          </h3>
          <div className="flex items-center justify-center min-h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mbtiData}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={2}
                  dataKey="count"
                  label={({ mbtiType, percentage }) => `${mbtiType} ${percentage}%`}
                  labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                >
                  {mbtiData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={MBTI_COLORS[index % MBTI_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any, name: any, props: any) => [
                    `${value} members (${props.payload.percentage}%)`,
                    props.payload.mbtiType
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Dimension Balance */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Personality Dimensions
          </h3>
          <div className="min-h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dimensionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="dimension" stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => [`${value}%`, 'Score']}
                />
                <Legend />
                <Bar dataKey="trait1" fill="hsl(var(--primary))" name="First Trait" />
                <Bar dataKey="trait2" fill="hsl(var(--accent))" name="Second Trait" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>• E/I: Extraversion vs Introversion</p>
            <p>• S/N: Sensing vs Intuition</p>
            <p>• T/F: Thinking vs Feeling</p>
            <p>• J/P: Judging vs Perceiving</p>
          </div>
        </Card>
      </div>

      {/* Type Breakdown Table */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Type Breakdown</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {mbtiData.map((type, index) => (
            <div 
              key={type.mbtiType}
              className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold" style={{ color: MBTI_COLORS[index] }}>
                  {type.mbtiType}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {type.percentage}%
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {type.count} members • {type.avgConfidence}% confidence
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
