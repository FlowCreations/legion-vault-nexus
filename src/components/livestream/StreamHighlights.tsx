import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scissors, Play, Eye, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Highlight {
  id: string;
  title: string;
  description: string | null;
  start_time_seconds: number;
  end_time_seconds: number;
  duration_seconds: number;
  view_count: number;
  created_at: string;
  created_by: string | null;
}

interface StreamHighlightsProps {
  eventId: string;
  onPlayHighlight?: (startTime: number, endTime: number) => void;
}

export function StreamHighlights({ eventId, onPlayHighlight }: StreamHighlightsProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadHighlights();
    getCurrentUser();

    // Subscribe to new highlights
    const channel = supabase
      .channel(`highlights-${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'livestream_highlights',
        filter: `event_id=eq.${eventId}`
      }, () => {
        loadHighlights();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const loadHighlights = async () => {
    try {
      const { data, error } = await supabase
        .from('livestream_highlights')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHighlights(data || []);
    } catch (error) {
      console.error('Error loading highlights:', error);
      toast.error('Failed to load highlights');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (highlightId: string) => {
    try {
      const { error } = await supabase
        .from('livestream_highlights')
        .delete()
        .eq('id', highlightId);

      if (error) throw error;
      toast.success('Highlight deleted');
    } catch (error) {
      console.error('Error deleting highlight:', error);
      toast.error('Failed to delete highlight');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Scissors className="w-4 h-4" />
            Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Scissors className="w-4 h-4" />
          Highlights ({highlights.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {highlights.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No highlights yet. Create one during the stream!
          </p>
        ) : (
          highlights.map((highlight) => (
            <div
              key={highlight.id}
              className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{highlight.title}</h4>
                  {highlight.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {highlight.description}
                    </p>
                  )}
                </div>
                {userId === highlight.created_by && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => handleDelete(highlight.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(highlight.start_time_seconds)} - {formatTime(highlight.end_time_seconds)}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {formatDuration(highlight.duration_seconds)}
                </Badge>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {highlight.view_count}
                </div>
              </div>

              {onPlayHighlight && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 mt-2"
                  onClick={() => onPlayHighlight(
                    highlight.start_time_seconds,
                    highlight.end_time_seconds
                  )}
                >
                  <Play className="w-3 h-3" />
                  Play Highlight
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
