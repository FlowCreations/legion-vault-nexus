import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

interface LiveViewerListProps {
  eventId: string;
}

interface Viewer {
  id: string;
  event_id: string;
  participant_id: string;
  participant_name: string;
  user_id?: string | null;
  session_id: string;
  avatar_url?: string | null;
  joined_at: string;
  left_at?: string | null;
  total_watch_time?: number;
}

export function LiveViewerList({ eventId }: LiveViewerListProps) {
  const [viewers, setViewers] = useState<Viewer[]>([]);

  useEffect(() => {
    loadViewers();

    // Subscribe to viewer join/leave events
    const channel = supabase
      .channel(`viewers-${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'livestream_viewers',
        filter: `event_id=eq.${eventId}`
      }, () => {
        loadViewers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const loadViewers = async () => {
    const { data } = await supabase
      .from('livestream_viewers')
      .select('*')
      .eq('event_id', eventId)
      .is('left_at', null) // Only show active viewers
      .order('joined_at', { ascending: false });

    if (data) {
      setViewers(data as Viewer[]);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4" />
          Live Viewers ({viewers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {viewers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No viewers yet
          </p>
        ) : (
          viewers.map((viewer) => (
            <div key={viewer.participant_id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarImage src={viewer.avatar_url} />
                <AvatarFallback className="text-xs">
                  {viewer.participant_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{viewer.participant_name}</p>
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(viewer.joined_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
