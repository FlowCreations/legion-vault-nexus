import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, Star, Medal, Gift, Clock, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface MilestoneStats {
  totalWithMilestones: number;
  silverStars: number;
  goldStars: number;
  champions: number;
  pendingRewards: number;
}

interface MilestoneAchievement {
  id: string;
  user_id: string;
  milestone_type: string;
  achieved_at: string;
  total_minutes_at_achievement: number;
  reward_claimed: boolean;
  display_name?: string;
  avatar_url?: string;
}

interface MilestoneProgress {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  current_badge: string;
  total_minutes: number;
  next_milestone: number;
  progress_percent: number;
}

const MILESTONE_CONFIG = {
  silver_star: { label: "Silver Star", icon: "⭐", minutes: 150, color: "bg-slate-400" },
  gold_star: { label: "Gold Star", icon: "🌟", minutes: 300, color: "bg-yellow-500" },
  dunbar_champion: { label: "Dunbar Champion", icon: "🏅", minutes: 600, color: "bg-amber-600" },
};

export function MilestoneTracker() {
  const [stats, setStats] = useState<MilestoneStats>({
    totalWithMilestones: 0,
    silverStars: 0,
    goldStars: 0,
    champions: 0,
    pendingRewards: 0,
  });
  const [recentAchievements, setRecentAchievements] = useState<MilestoneAchievement[]>([]);
  const [progressLeaders, setProgressLeaders] = useState<MilestoneProgress[]>([]);
  const [pendingRewards, setPendingRewards] = useState<MilestoneAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMilestoneData();
  }, []);

  const loadMilestoneData = async () => {
    try {
      setLoading(true);

      // Get milestone stats
      const { data: milestones } = await supabase
        .from('user_milestones')
        .select('milestone_type, reward_claimed');

      const silverStars = milestones?.filter(m => m.milestone_type === 'silver_star').length || 0;
      const goldStars = milestones?.filter(m => m.milestone_type === 'gold_star').length || 0;
      const champions = milestones?.filter(m => m.milestone_type === 'dunbar_champion').length || 0;
      const pendingCount = milestones?.filter(m => m.milestone_type === 'dunbar_champion' && !m.reward_claimed).length || 0;

      setStats({
        totalWithMilestones: new Set(milestones?.map(m => m.milestone_type)).size > 0 ? (milestones?.length || 0) : 0,
        silverStars,
        goldStars,
        champions,
        pendingRewards: pendingCount,
      });

      // Get recent achievements with user info
      const { data: recentData } = await supabase
        .from('user_milestones')
        .select(`
          id,
          user_id,
          milestone_type,
          achieved_at,
          total_minutes_at_achievement,
          reward_claimed
        `)
        .order('achieved_at', { ascending: false })
        .limit(10);

      if (recentData && recentData.length > 0) {
        // Fetch user profiles for achievements
        const userIds = [...new Set(recentData.map(a => a.user_id))];
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        const enrichedAchievements = recentData.map(a => ({
          ...a,
          display_name: profileMap.get(a.user_id)?.display_name || 'Unknown',
          avatar_url: profileMap.get(a.user_id)?.avatar_url,
        }));

        setRecentAchievements(enrichedAchievements);
      }

      // Get pending rewards (Dunbar Champions who haven't claimed)
      const { data: pendingData } = await supabase
        .from('user_milestones')
        .select(`
          id,
          user_id,
          milestone_type,
          achieved_at,
          total_minutes_at_achievement,
          reward_claimed
        `)
        .eq('milestone_type', 'dunbar_champion')
        .eq('reward_claimed', false);

      if (pendingData && pendingData.length > 0) {
        const userIds = [...new Set(pendingData.map(a => a.user_id))];
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        setPendingRewards(pendingData.map(a => ({
          ...a,
          display_name: profileMap.get(a.user_id)?.display_name || 'Unknown',
          avatar_url: profileMap.get(a.user_id)?.avatar_url,
        })));
      }

      // Get progress leaders (fans closest to next milestone)
      const { data: progressData } = await supabase
        .from('milestone_progress')
        .select(`
          user_id,
          current_badge,
          total_minutes,
          next_milestone_minutes
        `)
        .order('total_minutes', { ascending: false })
        .limit(20);

      if (progressData && progressData.length > 0) {
        const userIds = progressData.map(p => p.user_id);
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        // Calculate progress and sort by closest to next milestone
        const withProgress = progressData
          .filter(p => p.next_milestone_minutes && p.next_milestone_minutes > 0)
          .map(p => ({
            user_id: p.user_id,
            current_badge: p.current_badge,
            total_minutes: p.total_minutes || 0,
            next_milestone: p.next_milestone_minutes || 0,
            display_name: profileMap.get(p.user_id)?.display_name || 'Unknown',
            avatar_url: profileMap.get(p.user_id)?.avatar_url || null,
            progress_percent: Math.min(100, ((p.total_minutes || 0) / (p.next_milestone_minutes || 1)) * 100),
          }))
          .sort((a, b) => b.progress_percent - a.progress_percent)
          .slice(0, 10);

        setProgressLeaders(withProgress);
      }

    } catch (error) {
      console.error('Error loading milestone data:', error);
      toast({ title: "Error loading milestones", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneIcon = (type: string) => {
    const config = MILESTONE_CONFIG[type as keyof typeof MILESTONE_CONFIG];
    return config?.icon || "⭐";
  };

  const getMilestoneBadge = (type: string) => {
    const config = MILESTONE_CONFIG[type as keyof typeof MILESTONE_CONFIG];
    if (!config) return null;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.icon} {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Achievements</p>
            </div>
            <p className="text-2xl font-bold">{stats.totalWithMilestones}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-slate-400" />
              <p className="text-sm text-muted-foreground">Silver Stars</p>
            </div>
            <p className="text-2xl font-bold">{stats.silverStars}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <p className="text-sm text-muted-foreground">Gold Stars</p>
            </div>
            <p className="text-2xl font-bold">{stats.goldStars}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Medal className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-muted-foreground">Champions</p>
            </div>
            <p className="text-2xl font-bold">{stats.champions}</p>
          </CardContent>
        </Card>
        <Card className={stats.pendingRewards > 0 ? "border-amber-500" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-amber-500" />
              <p className="text-sm text-muted-foreground">Pending Rewards</p>
            </div>
            <p className="text-2xl font-bold text-amber-500">{stats.pendingRewards}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Achievements Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Recent Achievements
            </CardTitle>
            <CardDescription>Latest milestone achievements by fans</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAchievements.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No achievements yet</p>
            ) : (
              <div className="space-y-3">
                {recentAchievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={achievement.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {achievement.display_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{achievement.display_name}</p>
                        {getMilestoneBadge(achievement.milestone_type)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(achievement.achieved_at), { addSuffix: true })} • {Math.round(achievement.total_minutes_at_achievement / 60)}h total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Closest to Next Milestone
            </CardTitle>
            <CardDescription>Fans making progress toward their next badge</CardDescription>
          </CardHeader>
          <CardContent>
            {progressLeaders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No progress data available</p>
            ) : (
              <div className="space-y-3">
                {progressLeaders.map((fan, idx) => (
                  <div key={fan.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                    <div className="w-6 text-center font-bold text-muted-foreground">
                      {idx + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={fan.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {fan.display_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium truncate">{fan.display_name}</p>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(fan.progress_percent)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${fan.progress_percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round(fan.total_minutes)}m / {fan.next_milestone}m to next badge
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Rewards Section */}
      {pendingRewards.length > 0 && (
        <Card className="border-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-500">
              <Gift className="w-5 h-5" />
              Pending Reward Claims
            </CardTitle>
            <CardDescription>
              Dunbar Champions who haven't claimed their free album yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={reward.avatar_url || undefined} />
                      <AvatarFallback className="bg-amber-500/20 text-amber-500">
                        {reward.display_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{reward.display_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Achieved {formatDistanceToNow(new Date(reward.achieved_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-amber-500 text-white">
                    🏅 Champion - Reward Pending
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
