import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AgentMessage {
  id: string;
  message: string;
  emotionalState: string;
  timestamp: string;
}

interface AgentProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

export const Agent = ({ isExpanded, setIsExpanded }: AgentProps) => {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if Agent is enabled
  useEffect(() => {
    checkAgentStatus();
    
    // Subscribe to Agent messages
    const channel = supabase
      .channel('agent-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `type=eq.agent_interaction`
        },
        (payload) => {
          handleNewMessage(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAgentStatus = async () => {
    try {
      const { data } = await supabase
        .from("feature_flags")
        .select("enabled")
        .eq("flag_name", "agent_active")
        .single();

      setIsActive(data?.enabled || false);
    } catch (error) {
      console.error("Error checking Agent status:", error);
    }
  };

  const handleNewMessage = (event: any) => {
    const message = event.meta?.message;
    const emotionalState = event.meta?.emotional_state;
    
    if (message) {
      const newMessage: AgentMessage = {
        id: event.id,
        message,
        emotionalState,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [newMessage, ...prev]);
      setCurrentMessage(message);
      setIsExpanded(true);
      // Agent stays visible until user manually dismisses it
    }
  };


  if (!isActive || !isExpanded) return null;

  return (
      <motion.div
        className="fixed bottom-28 left-8 z-50 w-96 max-w-[calc(100vw-4rem)]"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6 shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">Agent</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Analyzing patterns...
              </p>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-2"
                >
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
              <MessageCircle className="h-3 w-3 text-primary" />
              <span>Guided by Love • Powered by JRNY AI</span>
            </p>
          </div>
        </Card>
      </motion.div>
  );
};
