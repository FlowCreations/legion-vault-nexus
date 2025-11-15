import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Target, TrendingUp, Mail, MessageSquare, BellRing, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Goal {
  id: string;
  goal_name: string;
  status: string;
  total_enrolled: number;
  total_converted: number;
  total_revenue: number;
  adaptive_sequences: Array<{
    sequence_name: string;
    is_active: boolean;
  }>;
}

export const AdaptiveSequenceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [channelStats, setChannelStats] = useState({
    email: 0,
    sms: 0,
    inbox: 0,
    popup: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      // Load active goals
      const { data: goalsData } = await supabase
        .from("marketing_goals")
        .select(`
          *,
          adaptive_sequences(sequence_name, is_active)
        `)
        .eq("merchant_id", user.user?.id)
        .eq("status", "active");

      setGoals(goalsData || []);

      // Load channel usage stats
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const { data: interactions } = await supabase
        .from("marketing_interactions")
        .select("channel_type")
        .gte("created_at", last30Days.toISOString());

      const stats = {
        email: interactions?.filter(i => i.channel_type === "email").length || 0,
        sms: interactions?.filter(i => i.channel_type === "sms").length || 0,
        inbox: interactions?.filter(i => i.channel_type === "inbox").length || 0,
        popup: interactions?.filter(i => i.channel_type === "popup").length || 0
      };

      setChannelStats(stats);

    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalInteractions = Object.values(channelStats).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Active Sequences</h2>
        <p className="text-sm text-muted-foreground">
          Monitor your adaptive marketing campaigns
        </p>
      </div>

      {/* Channel Distribution */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-5 w-5 text-primary" />
            <span className="font-semibold">Email</span>
          </div>
          <p className="text-2xl font-bold">{channelStats.email}</p>
          <p className="text-sm text-muted-foreground">
            {totalInteractions > 0 ? Math.round((channelStats.email / totalInteractions) * 100) : 0}% of total
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <span className="font-semibold">SMS</span>
          </div>
          <p className="text-2xl font-bold">{channelStats.sms}</p>
          <p className="text-sm text-muted-foreground">
            {totalInteractions > 0 ? Math.round((channelStats.sms / totalInteractions) * 100) : 0}% of total
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="font-semibold">Inbox</span>
          </div>
          <p className="text-2xl font-bold">{channelStats.inbox}</p>
          <p className="text-sm text-muted-foreground">
            {totalInteractions > 0 ? Math.round((channelStats.inbox / totalInteractions) * 100) : 0}% of total
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <BellRing className="h-5 w-5 text-primary" />
            <span className="font-semibold">Pop-Up</span>
          </div>
          <p className="text-2xl font-bold">{channelStats.popup}</p>
          <p className="text-sm text-muted-foreground">
            {totalInteractions > 0 ? Math.round((channelStats.popup / totalInteractions) * 100) : 0}% of total
          </p>
        </Card>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Active Goals</h3>
        
        {goals.length === 0 ? (
          <Card className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-semibold mb-2">No active sequences yet</h4>
            <p className="text-sm text-muted-foreground">
              Create your first adaptive funnel to start engaging users
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {goals.map((goal) => (
              <Card key={goal.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-1">{goal.goal_name}</h4>
                    {goal.adaptive_sequences && goal.adaptive_sequences.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {goal.adaptive_sequences[0].sequence_name}
                      </p>
                    )}
                  </div>
                  <Badge variant={goal.status === "active" ? "default" : "secondary"}>
                    {goal.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Enrolled</p>
                      <p className="text-lg font-semibold">{goal.total_enrolled}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Converted</p>
                      <p className="text-lg font-semibold">{goal.total_converted}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-lg font-semibold">${goal.total_revenue || 0}</p>
                    </div>
                  </div>
                </div>

                {goal.total_enrolled > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Conversion Rate</span>
                      <span className="font-semibold">
                        {Math.round((goal.total_converted / goal.total_enrolled) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};