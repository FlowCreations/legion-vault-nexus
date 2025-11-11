import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Pin, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  is_bot: boolean;
  is_pinned: boolean;
  created_at: string;
  user_id?: string;
  display_name?: string;
  avatar_url?: string;
}

interface LiveChatProps {
  eventId: string;
  isModerator?: boolean;
  onTipRequest?: () => void;
}

export const LiveChat = ({ eventId, isModerator = false, onTipRequest }: LiveChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("");
  const [userProfile, setUserProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    loadUsername();
    subscribeToMessages();
  }, [eventId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUsername = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Load user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        setUserProfile(profile);
        setUsername(profile.display_name || user.email?.split('@')[0] || 'Anonymous');
      } else {
        setUsername(user.email?.split('@')[0] || 'Anonymous');
      }
    } else {
      setUsername('Guest');
    }
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from('livestream_chat')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(100);
    
    if (data) {
      // Get unique user IDs
      const userIds = [...new Set(data.filter(msg => msg.user_id).map(msg => msg.user_id))];
      
      // Fetch profiles for all users
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);
      
      // Create a map of user profiles
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      // Transform to include profile data
      const messagesWithProfiles = data.map(msg => {
        const profile = msg.user_id ? profileMap.get(msg.user_id) : null;
        return {
          ...msg,
          display_name: profile?.display_name || msg.username,
          avatar_url: profile?.avatar_url || null
        };
      });
      
      setMessages(messagesWithProfiles as ChatMessage[]);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat:${eventId}`)
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
          
          // Fetch profile data for the new message
          if (newMsg.user_id) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('display_name, avatar_url')
              .eq('user_id', newMsg.user_id)
              .single();
            
            if (profile) {
              newMsg.display_name = profile.display_name || newMsg.username;
              newMsg.avatar_url = profile.avatar_url;
            }
          }
          
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    console.log('[LiveChat] Sending message:', { eventId, message: newMessage.trim() });

    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('[LiveChat] User:', { userId: user?.id, username });

    const { data, error } = await supabase.from('livestream_chat').insert({
      event_id: eventId,
      user_id: user?.id,
      username,
      message: newMessage.trim(),
      is_bot: false,
    }).select();

    if (error) {
      console.error('[LiveChat] Failed to send message:', error);
      toast.error('Failed to send message: ' + error.message);
    } else {
      console.log('[LiveChat] Message sent successfully:', data);
      setNewMessage("");
    }
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('livestream_chat')
      .update({ is_deleted: true })
      .eq('id', messageId);

    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Message deleted');
    }
  };

  const pinMessage = async (messageId: string, currentPinned: boolean) => {
    const { error } = await supabase
      .from('livestream_chat')
      .update({ is_pinned: !currentPinned })
      .eq('id', messageId);

    if (!error) {
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, is_pinned: !currentPinned } : m
      ));
      toast.success(currentPinned ? 'Message unpinned' : 'Message pinned');
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  return (
    <Card className="flex flex-col h-full border-0 rounded-none shadow-none">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Live Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg) => {
            const displayName = msg.display_name || msg.username;
            const initials = displayName
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            
            return (
              <div
                key={msg.id}
                className={cn(
                  "rounded-lg p-3 relative group",
                  msg.is_bot ? "bg-primary/10 border border-primary/20" : "bg-muted",
                  msg.is_pinned && "ring-2 ring-primary"
                )}
              >
                {msg.is_pinned && (
                  <Pin className="absolute top-2 right-2 w-3 h-3 text-primary" />
                )}
                <div className="flex items-start gap-2 mb-1">
                  <Avatar className="h-7 w-7 mt-0.5">
                    <AvatarImage src={msg.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/20">
                      {msg.is_bot ? "🤖" : initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-semibold text-sm truncate">
                        {displayName}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm break-words">{msg.message}</p>
                  </div>
                </div>
                
                {isModerator && (
                  <div className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => pinMessage(msg.id, msg.is_pinned)}
                    >
                      <Pin className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMessage(msg.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {onTipRequest && (
        <div className="px-4 pb-2">
          <Button 
            onClick={onTipRequest} 
            className="w-full"
            variant="secondary"
          >
            <span className="mr-2">💰</span>
            Send Tip
          </Button>
        </div>
      )}
      
      <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
        />
        <Button type="submit" size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </Card>
  );
};