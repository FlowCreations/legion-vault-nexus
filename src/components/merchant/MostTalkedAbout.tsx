import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Search, Users, Bot, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Topic {
  topic: string;
  mentions: number;
  sources: string[];
  category: string;
}

const categoryIcons = {
  tour: "🎤",
  merch: "👕",
  music: "🎵",
  video: "📹",
  general: "💬"
};

const sourceIcons = {
  search: Search,
  posts: Users,
  messages: MessageSquare,
  agent: Bot
};

export const MostTalkedAbout = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSamples, setTotalSamples] = useState(0);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('analyze-most-talked-about', {
        body: { days: 30 }
      });

      if (error) throw error;

      setTopics(data.topics || []);
      setTotalSamples(data.totalTextSamples || 0);
    } catch (error) {
      console.error('Error loading most talked about:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Most Talked About</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            Last 30 days • {totalSamples} interactions
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          Top topics across searches, comments, messages, and fan interactions
        </p>

        <div className="space-y-3">
          {topics.slice(0, 5).map((topic, index) => {
            const maxMentions = Math.max(...topics.map(t => t.mentions));
            const percentage = (topic.mentions / maxMentions) * 100;

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{categoryIcons[topic.category as keyof typeof categoryIcons]}</span>
                    <span className="font-medium capitalize">{topic.topic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {topic.sources.map(source => {
                      const Icon = sourceIcons[source as keyof typeof sourceIcons];
                      return Icon ? (
                        <Icon 
                          key={source} 
                          className="w-3.5 h-3.5 text-muted-foreground"
                        />
                      ) : null;
                    })}
                    <Badge variant="secondary" className="ml-2">
                      {topic.mentions}
                    </Badge>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}

          {topics.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Not enough data yet</p>
              <p className="text-sm">Topics will appear as fans interact with your content</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};