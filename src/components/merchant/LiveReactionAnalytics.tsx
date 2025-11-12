import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Sparkles, TrendingUp, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ReactionAnalyticsProps {
  eventId: string;
}

type ReactionData = {
  timestamp_seconds: number;
  reaction_type: string;
  user_id: string | null;
  session_id: string;
};

type TimelineData = {
  time: string;
  hearts: number;
  claps: number;
};

type TopMoment = {
  timestamp: number;
  total: number;
  hearts: number;
  claps: number;
};

export const LiveReactionAnalytics = ({ eventId }: ReactionAnalyticsProps) => {
  const [reactions, setReactions] = useState<ReactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHearts, setTotalHearts] = useState(0);
  const [totalClaps, setTotalClaps] = useState(0);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [topMoments, setTopMoments] = useState<TopMoment[]>([]);
  const [newReactionPulse, setNewReactionPulse] = useState(false);

  useEffect(() => {
    fetchReactions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`reactions-${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'livestream_reactions',
        filter: `event_id=eq.${eventId}`
      }, () => {
        // Trigger pulse animation
        setNewReactionPulse(true);
        setTimeout(() => setNewReactionPulse(false), 1000);
        fetchReactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('livestream_reactions')
        .select('timestamp_seconds, reaction_type, user_id, session_id')
        .eq('event_id', eventId)
        .order('timestamp_seconds', { ascending: true });

      if (error) throw error;

      setReactions(data || []);
      processReactionData(data || []);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const processReactionData = (data: ReactionData[]) => {
    // Calculate totals
    const hearts = data.filter(r => r.reaction_type === 'heart').length;
    const claps = data.filter(r => r.reaction_type === 'clap').length;
    setTotalHearts(hearts);
    setTotalClaps(claps);

    // Group by 10-second intervals for timeline
    const intervals: Record<number, { hearts: number; claps: number }> = {};
    data.forEach(r => {
      const interval = Math.floor(r.timestamp_seconds / 10) * 10;
      if (!intervals[interval]) {
        intervals[interval] = { hearts: 0, claps: 0 };
      }
      if (r.reaction_type === 'heart') {
        intervals[interval].hearts++;
      } else {
        intervals[interval].claps++;
      }
    });

    const timeline = Object.entries(intervals).map(([time, counts]) => ({
      time: formatTime(parseInt(time)),
      hearts: counts.hearts,
      claps: counts.claps,
    }));
    setTimelineData(timeline);

    // Find top moments (30-second windows with most reactions)
    const windows: Record<number, TopMoment> = {};
    data.forEach(r => {
      const window = Math.floor(r.timestamp_seconds / 30) * 30;
      if (!windows[window]) {
        windows[window] = { timestamp: window, total: 0, hearts: 0, claps: 0 };
      }
      windows[window].total++;
      if (r.reaction_type === 'heart') {
        windows[window].hearts++;
      } else {
        windows[window].claps++;
      }
    });

    const moments = Object.values(windows)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    setTopMoments(moments);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <Card className="p-6"><p className="text-muted-foreground">Loading analytics...</p></Card>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`p-6 transition-all duration-300 ${newReactionPulse ? 'ring-2 ring-red-500 scale-105' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Hearts</p>
              <p className="text-3xl font-bold text-red-500">{totalHearts}</p>
            </div>
            <Heart className={`w-10 h-10 text-red-500 ${newReactionPulse ? 'animate-pulse' : ''}`} />
          </div>
        </Card>

        <Card className={`p-6 transition-all duration-300 ${newReactionPulse ? 'ring-2 ring-primary scale-105' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Applause</p>
              <p className="text-3xl font-bold text-primary">{totalClaps}</p>
            </div>
            <Sparkles className={`w-10 h-10 text-primary ${newReactionPulse ? 'animate-pulse' : ''}`} />
          </div>
        </Card>

        <Card className={`p-6 transition-all duration-300 ${newReactionPulse ? 'ring-2 ring-primary scale-105' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Reactions</p>
              <p className="text-3xl font-bold">{totalHearts + totalClaps}</p>
            </div>
            <TrendingUp className={`w-10 h-10 text-primary ${newReactionPulse ? 'animate-pulse' : ''}`} />
          </div>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Reaction Timeline</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="time" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))' 
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="hearts" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Hearts"
            />
            <Line 
              type="monotone" 
              dataKey="claps" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Claps"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Moments */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Top Moments (Peak Engagement)
        </h3>
        <div className="space-y-3">
          {topMoments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reactions yet</p>
          ) : (
            topMoments.map((moment, index) => (
              <div 
                key={moment.timestamp}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-sm font-mono">
                    {formatTime(moment.timestamp)}
                  </Badge>
                  <div className="flex gap-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      {moment.hearts}
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                      {moment.claps}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{moment.total} reactions</span>
                  {index === 0 && <Badge className="bg-primary/20 text-primary">Peak</Badge>}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};