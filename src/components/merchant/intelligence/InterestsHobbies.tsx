import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Music, Film, Gamepad2, BookOpen, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Interest {
  category: string;
  count: number;
  percentage: number;
  icon: any;
  color: string;
}

export default function InterestsHobbies() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    setLoading(true);
    try {
      // Get event data to infer interests
      const { data: events, error } = await supabase
        .from('events')
        .select('type, content_id, meta')
        .in('type', ['watch_complete', 'watch_start', 'listen_complete', 'listen_start', 'page_view', 'purchase']);

      if (error) throw error;

      // Get total unique members
      const { count: memberCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      setTotalMembers(memberCount || 0);

      if (!events || events.length === 0) {
        setLoading(false);
        return;
      }

      // Categorize interests based on engagement patterns
      const interestCounts = {
        music: events.filter(e => e.type === 'listen_complete' || e.type === 'listen_start').length,
        videos: events.filter(e => e.type === 'watch_complete' || e.type === 'watch_start').length,
        merchandise: events.filter(e => {
          if (e.type === 'purchase' && e.meta && typeof e.meta === 'object') {
            return (e.meta as any).category === 'merch';
          }
          return false;
        }).length,
        liveEvents: events.filter(e => e.type === 'page_view' && e.content_id?.includes('livestream')).length,
        community: events.filter(e => e.type === 'page_view' && e.content_id?.includes('community')).length,
      };

      const total = Object.values(interestCounts).reduce((sum, count) => sum + count, 0);

      const interestData: Interest[] = [
        {
          category: 'Music',
          count: interestCounts.music,
          percentage: Math.round((interestCounts.music / total) * 100),
          icon: Music,
          color: 'hsl(var(--primary))',
        },
        {
          category: 'Videos',
          count: interestCounts.videos,
          percentage: Math.round((interestCounts.videos / total) * 100),
          icon: Film,
          color: 'hsl(var(--accent))',
        },
        {
          category: 'Merchandise',
          count: interestCounts.merchandise,
          percentage: Math.round((interestCounts.merchandise / total) * 100),
          icon: Heart,
          color: '#FF6B9D',
        },
        {
          category: 'Live Events',
          count: interestCounts.liveEvents,
          percentage: Math.round((interestCounts.liveEvents / total) * 100),
          icon: TrendingUp,
          color: '#FFB84D',
        },
        {
          category: 'Community',
          count: interestCounts.community,
          percentage: Math.round((interestCounts.community / total) * 100),
          icon: Gamepad2,
          color: '#4ECDC4',
        },
      ].sort((a, b) => b.count - a.count);

      setInterests(interestData);
    } catch (error) {
      console.error('Error fetching interests:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        Analyzing member interests...
      </div>
    );
  }

  if (interests.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">No Interest Data Yet</h3>
        <p className="text-muted-foreground">
          Interest data will appear here as members engage with content across your platform.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Member Interests & Hobbies</h2>
          <p className="text-muted-foreground mt-1">
            Based on {totalMembers.toLocaleString()} members' engagement patterns
          </p>
        </div>
      </div>

      {/* Top 5 Interests Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        {interests.map((interest, index) => {
          const Icon = interest.icon;
          return (
            <Card 
              key={interest.category}
              className="p-6 hover:shadow-lg transition-all duration-200 hover:scale-105"
              style={{ borderTopColor: interest.color, borderTopWidth: '3px' }}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div 
                  className="p-3 rounded-full"
                  style={{ backgroundColor: `${interest.color}20` }}
                >
                  <Icon className="h-6 w-6" style={{ color: interest.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{interest.category}</h3>
                  <p className="text-3xl font-bold mt-1" style={{ color: interest.color }}>
                    {interest.percentage}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {interest.count.toLocaleString()} engagements
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  #{index + 1} Interest
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Engagement Distribution Chart */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Engagement Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={interests}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="category" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: any, name: any, props: any) => [
                `${value.toLocaleString()} engagements (${props.payload.percentage}%)`,
                'Total'
              ]}
            />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Interest Details */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Detailed Breakdown</h3>
        <div className="space-y-4">
          {interests.map((interest) => {
            const Icon = interest.icon;
            return (
              <div 
                key={interest.category}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${interest.color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: interest.color }} />
                  </div>
                  <div>
                    <h4 className="font-semibold">{interest.category}</h4>
                    <p className="text-sm text-muted-foreground">
                      {interest.count.toLocaleString()} total engagements
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: interest.color }}>
                    {interest.percentage}%
                  </div>
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden mt-2">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${interest.percentage}%`,
                        backgroundColor: interest.color 
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="text-xs text-muted-foreground text-center">
        Interest data is derived from member engagement patterns and activity
      </div>
    </div>
  );
}
