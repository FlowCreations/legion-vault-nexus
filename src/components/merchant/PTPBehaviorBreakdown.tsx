import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BehaviorLog {
  behavior_key: string;
  behavior_name: string;
  weight: number;
  tier: string;
  triggered: boolean;
  count?: number;
}

interface PTPBreakdownProps {
  userId?: string;
  showDetailed?: boolean;
}

export const PTPBehaviorBreakdown = ({ userId, showDetailed = true }: PTPBreakdownProps) => {
  const [loading, setLoading] = useState(true);
  const [ptpData, setptpData] = useState<any>(null);
  const [behaviors, setBehaviors] = useState<BehaviorLog[]>([]);

  useEffect(() => {
    loadPTPData();
  }, [userId]);

  const loadPTPData = async () => {
    try {
      setLoading(true);

      // Get latest PTP score from daily scores
      const query = supabase
        .from('era_ptp_scores_daily')
        .select('*')
        .order('date', { ascending: false })
        .limit(1);

      if (userId) {
        query.eq('member_id', userId);
      }

      const { data: scoreData, error: scoreError } = await query.single();

      if (scoreError) throw scoreError;

      setptpData(scoreData);

      // Extract behavior breakdown from ptp_components
      const ptpComponents = scoreData?.ptp_components as any;
      if (ptpComponents && Array.isArray(ptpComponents.behaviorBreakdown)) {
        setBehaviors(ptpComponents.behaviorBreakdown);
      }

    } catch (error) {
      console.error('Error loading PTP data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!ptpData) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No PTP data available
        </CardContent>
      </Card>
    );
  }

  const zone = ptpData.ptp_components?.zone || 'red';
  const score = ptpData.ptp || 0;

  const getZoneColor = (z: string) => {
    if (z === 'green') return 'bg-green-500';
    if (z === 'yellow') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getZoneLabel = (z: string) => {
    if (z === 'green') return 'Prime to Purchase';
    if (z === 'yellow') return 'Warming Up';
    return 'Not Ready';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'emotional_committed': return 'bg-purple-500/10 text-purple-700 border-purple-300';
      case 'transactional': return 'bg-blue-500/10 text-blue-700 border-blue-300';
      case 'interactive': return 'bg-green-500/10 text-green-700 border-green-300';
      case 'exploratory': return 'bg-yellow-500/10 text-yellow-700 border-yellow-300';
      case 'passive': return 'bg-gray-500/10 text-gray-700 border-gray-300';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-300';
    }
  };

  const getTierLabel = (tier: string) => {
    return tier.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // Group behaviors by tier
  const behaviorsByTier = behaviors.reduce((acc, b) => {
    if (!acc[b.tier]) acc[b.tier] = [];
    acc[b.tier].push(b);
    return acc;
  }, {} as Record<string, BehaviorLog[]>);

  const totalPoints = behaviors.reduce((sum, b) => sum + b.weight, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>PTP Behavior Breakdown</CardTitle>
            <CardDescription>
              Detailed analysis of purchase readiness signals
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-3xl font-bold">{score}</div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
            <Badge className={`${getZoneColor(zone)} text-white border-0`}>
              {getZoneLabel(zone)}
            </Badge>
          </div>
        </div>
        <Progress value={score} className="mt-4" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0 (Red)</span>
          <span>34 (Yellow)</span>
          <span>67 (Green)</span>
          <span>100</span>
        </div>
      </CardHeader>

      {showDetailed && (
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Total Behaviors Triggered</span>
              <span className="text-muted-foreground">{behaviors.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Total Points</span>
              <span className="text-muted-foreground">{totalPoints}</span>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {Object.keys(behaviorsByTier).sort((a, b) => {
                  const tierOrder = ['emotional_committed', 'transactional', 'interactive', 'exploratory', 'passive'];
                  return tierOrder.indexOf(a) - tierOrder.indexOf(b);
                }).map(tier => (
                  <div key={tier} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getTierColor(tier)}>
                        {getTierLabel(tier)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {behaviorsByTier[tier].length} behaviors
                      </span>
                    </div>
                    <div className="space-y-1">
                      {behaviorsByTier[tier].map((behavior, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium">{behavior.behavior_name}</div>
                            {behavior.count && behavior.count > 1 && (
                              <div className="text-xs text-muted-foreground">
                                Triggered {behavior.count}x
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={behavior.weight > 0 ? "default" : "destructive"}>
                              {behavior.weight > 0 ? '+' : ''}{behavior.weight}
                            </Badge>
                            {behavior.weight > 10 && <TrendingUp className="h-4 w-4 text-green-500" />}
                            {behavior.weight < 0 && <TrendingDown className="h-4 w-4 text-red-500" />}
                            {behavior.weight > 0 && behavior.weight <= 10 && <Minus className="h-4 w-4 text-yellow-500" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
