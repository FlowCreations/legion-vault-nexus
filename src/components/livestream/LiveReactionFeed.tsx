import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';

interface LiveReactionFeedProps {
  eventId: string;
}

interface Reaction {
  id: string;
  reaction_type: 'heart' | 'clap';
  timestamp_seconds: number;
  created_at: string;
}

export function LiveReactionFeed({ eventId }: LiveReactionFeedProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [floatingReactions, setFloatingReactions] = useState<Array<{ id: string; emoji: string; timestamp: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to real-time reactions
    const channel = supabase
      .channel(`reactions-${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'livestream_reactions',
        filter: `event_id=eq.${eventId}`
      }, (payload) => {
        const newReaction = payload.new as Reaction;
        setReactions(prev => [newReaction, ...prev].slice(0, 20));
        
        // Add floating emoji
        const emoji = newReaction.reaction_type === 'heart' ? '❤️' : '👏';
        const floatingId = `${newReaction.id}-${Date.now()}`;
        setFloatingReactions(prev => [...prev, { id: floatingId, emoji, timestamp: Date.now() }]);
        
        // Remove after animation
        setTimeout(() => {
          setFloatingReactions(prev => prev.filter(r => r.id !== floatingId));
        }, 3000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  return (
    <Card className="h-full relative overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
          Live Reactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Floating emoji container */}
        <div 
          ref={containerRef}
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          {floatingReactions.map(({ id, emoji }) => (
            <div
              key={id}
              className="absolute bottom-0 text-3xl animate-float-up"
              style={{
                left: `${Math.random() * 80 + 10}%`,
                animationDuration: `${Math.random() * 1 + 2}s`
              }}
            >
              {emoji}
            </div>
          ))}
        </div>

        {/* Recent reactions list */}
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {reactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No reactions yet
            </p>
          ) : (
            reactions.map((reaction) => (
              <div 
                key={reaction.id} 
                className="flex items-center gap-2 text-sm animate-fade-in"
              >
                <span className="text-xl">
                  {reaction.reaction_type === 'heart' ? '❤️' : '👏'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(reaction.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) scale(1.5);
            opacity: 0;
          }
        }

        .animate-float-up {
          animation: float-up ease-out forwards;
        }
      `}</style>
    </Card>
  );
}
