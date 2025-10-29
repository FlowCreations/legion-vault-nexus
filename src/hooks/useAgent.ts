import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseAgentOptions {
  enabled?: boolean;
  checkInterval?: number; // minutes
}

export const useAgent = (options: UseAgentOptions = {}) => {
  const { enabled = true, checkInterval = 5 } = options;
  const { toast } = useToast();

  const triggerAgent = useCallback(async (
    triggerType: string,
    eventData?: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if Agent is active
      const { data: flagData } = await supabase
        .from("feature_flags")
        .select("enabled")
        .eq("flag_name", "agent_active")
        .single();

      if (!flagData?.enabled) return;

      // Get recent events
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: recentEvents } = await supabase
        .from("events")
        .select("*")
        .eq("member_id", user.id)
        .gte("ts", thirtyMinAgo)
        .order("ts", { ascending: false })
        .limit(20);

      // Call Agent edge function
      const { data, error } = await supabase.functions.invoke("agent", {
        body: {
          userId: user.id,
          triggerType,
          recentEvents,
          eventData
        }
      });

      if (error) {
        console.error("Agent error:", error);
        return;
      }

      console.log("Agent response:", data);
    } catch (error) {
      console.error("Error triggering Agent:", error);
    }
  }, []);

  // Auto-check behavior patterns periodically
  useEffect(() => {
    if (!enabled) return;

    const checkBehavior = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const recentMinutes = checkInterval;
        const cutoff = new Date(Date.now() - recentMinutes * 60 * 1000).toISOString();
        
        const { data: recentEvents } = await supabase
          .from("events")
          .select("*")
          .eq("member_id", user.id)
          .gte("ts", cutoff)
          .order("ts", { ascending: false });

        if (!recentEvents || recentEvents.length === 0) return;

        // Detect high-engagement patterns
        const musicEvents = recentEvents.filter(e => {
          const eventType = (e.meta as any)?.event_type;
          return eventType?.includes('track_') || eventType?.includes('song_');
        });
        
        const productEvents = recentEvents.filter(e => {
          const eventType = (e.meta as any)?.event_type;
          return eventType?.includes('product_view');
        });

        // Trigger if strong engagement detected
        if (musicEvents.length >= 2 || productEvents.length >= 3) {
          await triggerAgent("high_engagement_detected", {
            musicEvents: musicEvents.length,
            productEvents: productEvents.length
          });
        }
      } catch (error) {
        console.error("Error in Agent behavior check:", error);
      }
    };

    // Check immediately
    checkBehavior();

    // Then check periodically
    const interval = setInterval(checkBehavior, checkInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, checkInterval, triggerAgent]);

  return {
    triggerAgent
  };
};
