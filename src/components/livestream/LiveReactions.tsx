import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LiveReactionsProps {
  eventId: string;
  streamStartTime?: Date;
}

export const LiveReactions = ({ eventId, streamStartTime }: LiveReactionsProps) => {
  const [reactionAnimation, setReactionAnimation] = useState<'heart' | 'clap' | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const animationTimeoutRef = useRef<NodeJS.Timeout>();
  const floatingEmojisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const getTimestamp = (): number => {
    if (!streamStartTime) return 0;
    const now = new Date();
    const diff = now.getTime() - streamStartTime.getTime();
    return Math.floor(diff / 1000); // Convert to seconds
  };

  const createFloatingEmoji = (emoji: string) => {
    if (!floatingEmojisRef.current) return;

    const emojiEl = document.createElement('div');
    emojiEl.className = 'floating-emoji';
    emojiEl.textContent = emoji;
    emojiEl.style.left = `${Math.random() * 80 + 10}%`;
    emojiEl.style.animationDuration = `${Math.random() * 1 + 2}s`;
    
    floatingEmojisRef.current.appendChild(emojiEl);

    setTimeout(() => {
      emojiEl.remove();
    }, 3000);
  };

  const handleReaction = async (type: 'heart' | 'clap') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const timestamp = getTimestamp();

      // Insert reaction to database
      const { error } = await supabase.from('livestream_reactions').insert({
        event_id: eventId,
        user_id: user?.id,
        session_id: sessionId,
        reaction_type: type,
        timestamp_seconds: timestamp,
      });

      if (error) throw error;

      // Trigger visual feedback
      setReactionAnimation(type);
      createFloatingEmoji(type === 'heart' ? '❤️' : '👏');

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      animationTimeoutRef.current = setTimeout(() => {
        setReactionAnimation(null);
      }, 300);

    } catch (error) {
      console.error('Error sending reaction:', error);
      toast.error('Failed to send reaction');
    }
  };

  return (
    <>
      <div 
        ref={floatingEmojisRef}
        className="absolute inset-0 pointer-events-none overflow-hidden z-10"
        aria-hidden="true"
      />
      
      <div className="flex gap-2">
        <Button
          size="lg"
          variant="outline"
          onClick={() => handleReaction('heart')}
          className={cn(
            "gap-2 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all",
            reactionAnimation === 'heart' && "scale-110 bg-primary/20 border-primary/60"
          )}
        >
          <Heart 
            className={cn(
              "w-5 h-5 transition-all",
              reactionAnimation === 'heart' ? "fill-red-500 text-red-500" : "text-primary"
            )} 
          />
          <span className="text-sm font-medium">Love it</span>
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={() => handleReaction('clap')}
          className={cn(
            "gap-2 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all",
            reactionAnimation === 'clap' && "scale-110 bg-primary/20 border-primary/60"
          )}
        >
          <Sparkles 
            className={cn(
              "w-5 h-5 transition-all",
              reactionAnimation === 'clap' ? "text-primary" : "text-primary"
            )} 
          />
          <span className="text-sm font-medium">Applause</span>
        </Button>
      </div>

      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-150px) scale(1.5);
            opacity: 0;
          }
        }

        .floating-emoji {
          position: absolute;
          bottom: 0;
          font-size: 2rem;
          animation: float-up ease-out forwards;
          pointer-events: none;
        }
      `}</style>
    </>
  );
};