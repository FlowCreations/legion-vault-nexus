import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";

interface FunnelStage {
  key: string;
  label: string;
  count: number;
  percentage: number;
  dropOffRate: number;
}

export function JourneyFunnelVisualization() {
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    loadFunnelData();
  }, []);

  const loadFunnelData = async () => {
    try {
      setLoading(true);

      // Get total user count
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      setTotalUsers(userCount || 0);

      // Get milestone counts for each stage
      const milestoneKeys = [
        { key: 'first_portal_visit', label: 'First Visit' },
        { key: 'email_verified', label: 'Email Verified' },
        { key: 'first_video_complete', label: 'Video Complete' },
        { key: 'first_song_finish', label: 'Song Finished' },
        { key: 'first_store_visit', label: 'Store Visit' },
        { key: 'first_add_to_cart', label: 'Added to Cart' },
        { key: 'first_purchase', label: 'First Purchase' },
        { key: 'repeat_buyer', label: 'Repeat Buyer' },
        { key: 'super_fan', label: 'Super Fan' },
      ];

      const stageCounts: FunnelStage[] = [];
      let previousCount = userCount || 0;

      for (const milestone of milestoneKeys) {
        const { count } = await supabase
          .from('fan_journey_milestones')
          .select('*', { count: 'exact', head: true })
          .eq('milestone_key', milestone.key);

        const currentCount = count || 0;
        const percentage = userCount ? (currentCount / userCount) * 100 : 0;
        const dropOffRate = previousCount > 0 
          ? ((previousCount - currentCount) / previousCount) * 100 
          : 0;

        stageCounts.push({
          key: milestone.key,
          label: milestone.label,
          count: currentCount,
          percentage: Math.round(percentage * 10) / 10,
          dropOffRate: Math.round(dropOffRate * 10) / 10,
        });

        previousCount = currentCount;
      }

      setStages(stageCounts);
    } catch (error) {
      console.error('Error loading funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Find biggest drop-off points
  const biggestDropOffs = [...stages]
    .filter(s => s.dropOffRate > 0)
    .sort((a, b) => b.dropOffRate - a.dropOffRate)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Journey Funnel
          </CardTitle>
          <CardDescription>
            {totalUsers.toLocaleString()} total users in system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stages.map((stage, index) => {
              const widthPercentage = Math.max(10, stage.percentage);
              const isHighDropOff = stage.dropOffRate > 50;
              
              return (
                <div key={stage.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{stage.count.toLocaleString()}</span>
                      <Badge variant="outline" className="text-xs">
                        {stage.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <div className="relative h-8 bg-muted/30 rounded overflow-hidden">
                    <div 
                      className={`absolute left-0 top-0 h-full rounded transition-all duration-500 ${
                        index === 0 ? 'bg-blue-500/60' :
                        index < 4 ? 'bg-purple-500/60' :
                        index < 7 ? 'bg-amber-500/60' :
                        'bg-emerald-500/60'
                      }`}
                      style={{ width: `${widthPercentage}%` }}
                    />
                    {stage.dropOffRate > 0 && index > 0 && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <TrendingDown className={`w-3 h-3 ${isHighDropOff ? 'text-red-400' : 'text-amber-400'}`} />
                        <span className={`text-xs ${isHighDropOff ? 'text-red-400' : 'text-amber-400'}`}>
                          -{stage.dropOffRate}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Drop-off Analysis */}
      {biggestDropOffs.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              Biggest Drop-off Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {biggestDropOffs.map((stage, index) => (
                <div key={stage.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-amber-400">#{index + 1}</span>
                    <span className="text-sm">{stage.label}</span>
                  </div>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    {stage.dropOffRate}% drop
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversion Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {stages.find(s => s.key === 'email_verified')?.percentage || 0}%
            </p>
            <p className="text-xs text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-purple-400">
              {stages.find(s => s.key === 'first_video_complete')?.percentage || 0}%
            </p>
            <p className="text-xs text-muted-foreground">Engaged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-amber-400">
              {stages.find(s => s.key === 'first_purchase')?.percentage || 0}%
            </p>
            <p className="text-xs text-muted-foreground">Converted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {stages.find(s => s.key === 'super_fan')?.percentage || 0}%
            </p>
            <p className="text-xs text-muted-foreground">Super Fans</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
