import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Scissors, 
  Trash2, 
  Ban, 
  Pin, 
  Users, 
  MessageSquare,
  Activity,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreateHighlightDialog } from './CreateHighlightDialog';
import { cn } from '@/lib/utils';

interface MerchantStreamControlsProps {
  eventId: string;
  streamStartTime?: Date;
  currentViewerCount: number;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  created_at: string;
  user_id?: string;
  is_pinned: boolean;
  is_deleted: boolean;
}

export function MerchantStreamControls({ 
  eventId, 
  streamStartTime,
  currentViewerCount 
}: MerchantStreamControlsProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showHighlightDialog, setShowHighlightDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [totalReactions, setTotalReactions] = useState(0);

  useEffect(() => {
    loadChatMessages();
    loadStreamStats();
    subscribeToChat();
    
    // Track current playback time
    const interval = setInterval(() => {
      if (streamStartTime) {
        const elapsed = Math.floor((Date.now() - streamStartTime.getTime()) / 1000);
        setCurrentTime(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [eventId, streamStartTime]);

  const loadChatMessages = async () => {
    const { data } = await supabase
      .from('livestream_chat')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) {
      setMessages(data as ChatMessage[]);
    }
  };

  const loadStreamStats = async () => {
    // Get peak viewers
    const { data: viewerData } = await supabase
      .from('livestream_viewers')
      .select('event_id')
      .eq('event_id', eventId)
      .is('left_at', null);
    
    if (viewerData) {
      setPeakViewers(Math.max(peakViewers, viewerData.length));
    }

    // Get total reactions
    const { data: reactionData, count } = await supabase
      .from('livestream_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);
    
    if (count !== null) {
      setTotalReactions(count);
    }
  };

  const subscribeToChat = () => {
    const channel = supabase
      .channel(`merchant-chat:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'livestream_chat',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          loadChatMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('livestream_chat')
      .update({ is_deleted: true })
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to delete message');
    } else {
      toast.success('Message deleted');
      loadChatMessages();
    }
  };

  const handlePinMessage = async (messageId: string, currentlyPinned: boolean) => {
    const { error } = await supabase
      .from('livestream_chat')
      .update({ is_pinned: !currentlyPinned })
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to pin message');
    } else {
      toast.success(currentlyPinned ? 'Message unpinned' : 'Message pinned');
      loadChatMessages();
    }
  };

  const handleBanUser = async (userId: string, username: string) => {
    // Delete all messages from user
    const { error } = await supabase
      .from('livestream_chat')
      .update({ is_deleted: true })
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      toast.error('Failed to ban user');
    } else {
      toast.success(`Banned ${username} and removed their messages`);
      loadChatMessages();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="space-y-4">
        {/* Stream Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5" />
              Live Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  Current Viewers
                </div>
                <div className="text-2xl font-bold">{currentViewerCount}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  Peak Viewers
                </div>
                <div className="text-2xl font-bold">{peakViewers}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Reactions</div>
                <div className="text-2xl font-bold">{totalReactions}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Stream Time</div>
                <div className="text-2xl font-bold">{formatTime(currentTime)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Highlight */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scissors className="w-5 h-5" />
              Highlight Creator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowHighlightDialog(true)}
              className="w-full"
            >
              <Scissors className="w-4 h-4 mr-2" />
              Create Highlight at {formatTime(currentTime)}
            </Button>
          </CardContent>
        </Card>

        {/* Chat Moderation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="w-5 h-5" />
              Chat Moderation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      msg.is_deleted && "opacity-50 bg-destructive/10 border-destructive/20",
                      msg.is_pinned && "bg-primary/5 border-primary/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{msg.username}</span>
                        {msg.is_pinned && (
                          <Badge variant="secondary" className="text-xs">
                            <Pin className="w-3 h-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                        {msg.is_deleted && (
                          <Badge variant="destructive" className="text-xs">
                            Deleted
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <p className="text-sm mb-3">{msg.message}</p>
                    
                    {!msg.is_deleted && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePinMessage(msg.id, msg.is_pinned)}
                        >
                          <Pin className="w-3 h-3 mr-1" />
                          {msg.is_pinned ? 'Unpin' : 'Pin'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteMessage(msg.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                        {msg.user_id && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleBanUser(msg.user_id!, msg.username)}
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Ban User
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <CreateHighlightDialog
        open={showHighlightDialog}
        onOpenChange={setShowHighlightDialog}
        eventId={eventId}
        currentTime={currentTime}
        streamStartTime={streamStartTime}
      />
    </>
  );
}
