import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  is_bot: boolean;
  created_at: string;
  display_name?: string;
  avatar_url?: string;
  user_id?: string;
}

interface LiveChatPreviewProps {
  eventId: string;
  onViewFullChat?: () => void;
}

export function LiveChatPreview({ eventId, onViewFullChat }: LiveChatPreviewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    loadRecentMessages();
    subscribeToMessages();
  }, [eventId]);

  const loadRecentMessages = async () => {
    const { data } = await supabase
      .from('livestream_chat')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) {
      const userIds = [...new Set(data.filter(msg => msg.user_id).map(msg => msg.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const messagesWithProfiles = data.map(msg => {
        const profile = msg.user_id ? profileMap.get(msg.user_id) : null;
        return {
          ...msg,
          display_name: profile?.display_name || msg.username,
          avatar_url: profile?.avatar_url || null
        };
      }).reverse();
      
      setMessages(messagesWithProfiles as ChatMessage[]);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat-preview:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'livestream_chat',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          
          if (newMsg.user_id) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('display_name, avatar_url')
              .eq('user_id', newMsg.user_id)
              .single();
            
            if (profile) {
              newMsg.display_name = profile.display_name;
              newMsg.avatar_url = profile.avatar_url;
            }
          }
          
          setMessages(prev => [...prev, newMsg].slice(-10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Recent Chat
          </CardTitle>
          {onViewFullChat && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs gap-1"
              onClick={onViewFullChat}
            >
              Full Chat
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No messages yet
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex gap-2 animate-fade-in">
                  <Avatar className="w-6 h-6 mt-1">
                    <AvatarImage src={msg.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {(msg.display_name || msg.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium truncate">
                        {msg.display_name || msg.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground break-words">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
