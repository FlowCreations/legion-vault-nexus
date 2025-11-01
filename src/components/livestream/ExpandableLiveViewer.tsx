import React, { useEffect, useState, useRef } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Maximize2, DollarSign, Share2 } from 'lucide-react';
import { LiveChat } from './LiveChat';
import { toast } from 'sonner';

type Props = { 
  eventId: string;
  onTip?: () => void;
  onShare?: () => void;
};

export function ExpandableLiveViewer({ eventId, onTip, onShare }: Props) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string>();
  const [isExpanded, setIsExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const expandedVideoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);

  const connect = async () => {
    setStatus('connecting');
    setError(undefined);
    console.log('[Viewer] Connecting to room:', eventId);

    try {
      // Get token from edge function
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('livekit-token', {
        body: { 
          roomName: eventId, 
          participantName: `Viewer-${Math.random().toString(36).substr(2, 9)}`,
          role: 'viewer' 
        },
      });

      if (tokenError) throw tokenError;
      console.log('[Viewer] Token received');

      const livekitUrl = import.meta.env.VITE_LIVEKIT_URL || 'wss://sonsoflegionlivestudio-lvof78tr.livekit.cloud';

      // Create and connect room
      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.Connected, () => {
        console.log('[Viewer] Connected to room');
        setStatus('connected');
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('[Viewer] Disconnected from room');
        setStatus('idle');
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('[Viewer] Track subscribed:', track.kind, 'from', participant.identity);
        if (track.kind === Track.Kind.Video) {
          if (videoRef.current) {
            track.attach(videoRef.current);
          }
          if (expandedVideoRef.current && isExpanded) {
            track.attach(expandedVideoRef.current);
          }
          console.log('[Viewer] Video track attached');
        }
      });

      await room.connect(livekitUrl, tokenData.token);
      console.log('[Viewer] Viewing stream!');
    } catch (e: any) {
      console.error('[Viewer] Error:', e);
      setError(e.message);
      setStatus('error');
    }
  };

  const disconnect = () => {
    console.log('[Viewer] Disconnecting');
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  };

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (status === 'idle' && eventId) {
      connect();
    }
  }, [eventId]);

  const handleTip = () => {
    if (onTip) {
      onTip();
    } else {
      toast.success('Tip feature coming soon!');
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <>
      <div className="relative group">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          controls 
          className="w-full rounded-lg border bg-black aspect-video" 
        />
        
        {/* Player Controls Overlay */}
        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsExpanded(true)}
          >
            <Maximize2 className="w-4 h-4 mr-1" />
            Expand
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleTip}
          >
            <DollarSign className="w-4 h-4 mr-1" />
            Tip
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>

        {/* Status Indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full">
          <span className={`inline-block h-2 w-2 rounded-full ${
            status === 'connected' ? 'bg-green-500' : 
            status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
            'bg-red-500'
          }`} />
          <span className="text-white text-xs font-medium uppercase">{status}</span>
        </div>
      </div>

      {/* Expanded View Dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-[95vw] h-[90vh] p-0">
          <div className="grid grid-cols-[1fr_400px] h-full gap-0">
            {/* Video Player */}
            <div className="relative bg-black flex items-center justify-center">
              <video 
                ref={expandedVideoRef} 
                autoPlay 
                playsInline 
                controls 
                className="w-full h-full" 
              />
              
              {/* Expanded Controls */}
              <div className="absolute bottom-6 right-6 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleTip}
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Tip
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
            
            {/* Live Chat Sidebar */}
            <div className="border-l bg-background">
              <LiveChat eventId={eventId} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800 mt-2">
          {error}
        </div>
      )}
    </>
  );
}
