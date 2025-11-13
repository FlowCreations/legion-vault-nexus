import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
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
  const [recentReactions, setRecentReactions] = useState<Array<{ type: string; timestamp: number }>>([]);
  const recentReactionsTimeoutRef = useRef<NodeJS.Timeout>();

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

  const createFloatingEmoji = (emoji: string, isBurst = false) => {
    if (!floatingEmojisRef.current) return;

    const count = isBurst ? Math.floor(Math.random() * 5) + 8 : 1; // 8-12 emojis for burst, 1 for normal
    
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const emojiEl = document.createElement('div');
        emojiEl.className = isBurst ? 'floating-emoji burst-emoji' : 'floating-emoji';
        emojiEl.textContent = emoji;
        emojiEl.style.left = `${Math.random() * 80 + 10}%`;
        emojiEl.style.animationDuration = `${Math.random() * 1 + 2}s`;
        
        if (isBurst) {
          // Add slight horizontal offset for burst effect
          emojiEl.style.setProperty('--burst-x', `${(Math.random() - 0.5) * 100}px`);
        }
        
        floatingEmojisRef.current?.appendChild(emojiEl);

        setTimeout(() => {
          emojiEl.remove();
        }, 3000);
      }, isBurst ? i * 50 : 0); // Stagger burst animations
    }
  };

  const checkForBurst = (type: 'heart' | 'clap') => {
    const now = Date.now();
    const recentOfType = recentReactions.filter(
      r => r.type === type && now - r.timestamp < 2000 // Within last 2 seconds
    );
    
    // If 3+ reactions of same type in 2 seconds, trigger burst
    return recentOfType.length >= 2;
  };

  const handleReaction = async (type: 'heart' | 'clap') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const timestamp = getTimestamp();

      // Track recent reactions for burst detection
      const now = Date.now();
      const newReaction = { type, timestamp: now };
      setRecentReactions(prev => [...prev, newReaction]);
      
      // Clear old reactions from tracking after 2 seconds
      if (recentReactionsTimeoutRef.current) {
        clearTimeout(recentReactionsTimeoutRef.current);
      }
      recentReactionsTimeoutRef.current = setTimeout(() => {
        setRecentReactions(prev => prev.filter(r => now - r.timestamp < 2000));
      }, 2000);

      // Check if this should trigger a burst
      const isBurst = checkForBurst(type);

      // Insert reaction to database
      const { error } = await supabase.from('livestream_reactions').insert({
        event_id: eventId,
        user_id: user?.id,
        session_id: sessionId,
        reaction_type: type,
        timestamp_seconds: timestamp,
      });

      if (error) throw error;

      // Trigger visual feedback with burst if applicable
      setReactionAnimation(type);
      createFloatingEmoji(type === 'heart' ? '❤️' : '👏', isBurst);

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
          size="sm"
          variant="outline"
          onClick={() => handleReaction('heart')}
          className={cn(
            "gap-1.5 px-3 py-2 min-h-[44px] touch-manipulation bg-background/80 backdrop-blur-sm border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 transition-all active:scale-95",
            reactionAnimation === 'heart' && "scale-110 bg-red-500/20 border-red-500/70"
          )}
        >
          <Heart 
            className="w-4 h-4 fill-red-500 text-red-500 transition-all" 
          />
          <span className="text-xs font-medium text-red-500">Love it</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleReaction('clap')}
          className={cn(
            "gap-1.5 px-3 py-2 min-h-[44px] touch-manipulation bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all active:scale-95",
            reactionAnimation === 'clap' && "scale-110 bg-primary/20 border-primary/60"
          )}
        >
          <span className="text-xl transition-all">👏</span>
          <span className="text-xs font-medium">Applause</span>
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

        @keyframes burst-float {
          0% {
            transform: translateY(0) translateX(0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-180px) translateX(var(--burst-x, 0px)) scale(1.8) rotate(360deg);
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

        .burst-emoji {
          animation: burst-float cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          font-size: 2.5rem;
        }
      `}</style>
    </>
  );
};