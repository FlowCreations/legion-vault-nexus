import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { NextBestAction } from "@/types/personality";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Globe, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";


const channelIcons = {
  email: Mail,
  dm: MessageSquare,
  site: Globe,
  push: Bell,
};

export const NBAQueue = () => {
  const [nbas, setNbas] = useState<NextBestAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNBAs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('nba-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'next_best_actions',
        },
        () => {
          loadNBAs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNBAs = async () => {
    try {
      const { data } = await supabase
        .from('next_best_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNbas(data);
      }
    } catch (error) {
      console.error('Error loading NBAs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading NBA queue...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live NBA Queue</CardTitle>
        <CardDescription>Real-time next-best-actions being generated</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {nbas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No NBAs generated yet</p>
          ) : (
            nbas.map((nba) => {
              const Icon = channelIcons[nba.channel as keyof typeof channelIcons] || Globe;
              return (
                <div
                  key={nba.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Icon className="w-5 h-5 mt-1 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{nba.personality_match?.mbti_type}</Badge>
                      <Badge variant={nba.status === 'sent' ? 'default' : 'secondary'}>
                        {nba.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(nba.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      {nba.offer_id} → {nba.channel}
                    </p>
                    {nba.message_recipe?.subject && (
                      <p className="text-xs text-muted-foreground truncate">
                        {nba.message_recipe.subject}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
