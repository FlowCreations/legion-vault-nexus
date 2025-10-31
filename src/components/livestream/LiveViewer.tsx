import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LiveViewerProps {
  eventId: string;
  streamUrl?: string;
}

export const LiveViewer = ({ eventId, streamUrl }: LiveViewerProps) => {
  const [viewerCount, setViewerCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionId = useRef(crypto.randomUUID());

  useEffect(() => {
    trackViewer();
    checkStreamStatus();
    
    const interval = setInterval(updateViewerCount, 5000);
    
    return () => {
      clearInterval(interval);
      leaveStream();
    };
  }, [eventId]);

  const trackViewer = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('livestream_viewers').insert({
      event_id: eventId,
      user_id: user?.id,
      session_id: sessionId.current,
    });
  };

  const leaveStream = async () => {
    await supabase
      .from('livestream_viewers')
      .update({ left_at: new Date().toISOString() })
      .eq('session_id', sessionId.current)
      .is('left_at', null);
  };

  const checkStreamStatus = async () => {
    const { data } = await supabase
      .from('livestream_events')
      .select('status')
      .eq('id', eventId)
      .single();
    
    setIsLive(data?.status === 'live');
  };

  const updateViewerCount = async () => {
    const { count } = await supabase
      .from('livestream_viewers')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .is('left_at', null);
    
    setViewerCount(count || 0);
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <div className="aspect-video bg-black">
          {isLive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-white text-lg">Stream will start soon...</p>
            </div>
          )}
        </div>
        
        <div className="absolute top-4 left-4 flex gap-2">
          {isLive && (
            <Badge variant="destructive" className="gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1">
            <Eye className="w-3 h-3" />
            {viewerCount}
          </Badge>
        </div>
      </div>
    </Card>
  );
};