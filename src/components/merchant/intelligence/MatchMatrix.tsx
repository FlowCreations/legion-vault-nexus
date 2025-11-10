import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface MatchMatrixScore {
  user_id: string;
  oracle_score: number;
  epiphany_score: number;
  behavioral_score: number;
  total_match_score: number;
  segment: string;
  last_updated: string;
}

export const MatchMatrix = () => {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<MatchMatrixScore[]>([]);

  useEffect(() => {
    loadMatchMatrix();
  }, []);

  const loadMatchMatrix = async () => {
    try {
      const { data, error } = await supabase
        .from('match_matrix_scores')
        .select('*')
        .order('total_match_score', { ascending: false })
        .limit(100);

      if (error) throw error;
      setScores(data || []);
    } catch (error) {
      console.error('Error loading match matrix:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'trigger': return 'text-green-500 bg-green-500/10';
      case 'nurture': return 'text-yellow-500 bg-yellow-500/10';
      case 'observe': return 'text-red-500 bg-red-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const segmentCounts = {
    trigger: scores.filter(s => s.segment === 'trigger').length,
    nurture: scores.filter(s => s.segment === 'nurture').length,
    observe: scores.filter(s => s.segment === 'observe').length,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Match Matrix Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Segment Distribution */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="text-2xl font-bold text-green-500">{segmentCounts.trigger}</div>
            <div className="text-xs text-muted-foreground">Trigger Zone</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="text-2xl font-bold text-yellow-500">{segmentCounts.nurture}</div>
            <div className="text-xs text-muted-foreground">Nurture Zone</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="text-2xl font-bold text-red-500">{segmentCounts.observe}</div>
            <div className="text-xs text-muted-foreground">Observe Zone</div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Top Scoring Users</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {scores.slice(0, 10).map((score) => (
              <div key={score.user_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSegmentColor(score.segment)}`}>
                    {score.segment}
                  </span>
                  <div className="text-sm">
                    <div className="font-medium">Score: {score.total_match_score}</div>
                    <div className="text-xs text-muted-foreground">
                      Oracle: {score.oracle_score} | Epiphany: {score.epiphany_score} | Behavioral: {score.behavioral_score}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Match Matrix combines Oracle (PTP), Epiphany (ERA), and behavioral data
        </p>
      </CardContent>
    </Card>
  );
};
