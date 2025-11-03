import React, { useEffect, useState, useRef } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Maximize2, DollarSign, Share2 } from 'lucide-react';
import { LiveChat } from './LiveChat';
import { TipDialog } from './TipDialog';
import { toast } from 'sonner';

type Props = { 
  eventId: string;
  onTip?: () => void;
  onShare?: () => void;
  showExternalControls?: boolean;
};

export function ExpandableLiveViewer({ eventId, onTip, onShare, showExternalControls = false }: Props) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const expandedVideoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const videoTrackRef = useRef<Track | null>(null);
  const audioTrackRef = useRef<Track | null>(null);

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
        // Update viewer count on connect
        setViewerCount(room.numParticipants);
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('[Viewer] Disconnected from room');
        setStatus('idle');
      });

      room.on(RoomEvent.ParticipantConnected, () => {
        console.log('[Viewer] Participant joined');
        if (roomRef.current) {
          setViewerCount(roomRef.current.numParticipants);
        }
      });

      room.on(RoomEvent.ParticipantDisconnected, () => {
        console.log('[Viewer] Participant left');
        if (roomRef.current) {
          setViewerCount(roomRef.current.numParticipants);
        }
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('[Viewer] Track subscribed:', track.kind, 'from', participant.identity);
        if (track.kind === Track.Kind.Video) {
          videoTrackRef.current = track;
          setHasVideoTrack(true);
          
          // Always attach to compact view initially
          if (videoRef.current) {
            track.attach(videoRef.current);
            console.log('[Viewer] Video track attached to compact view');
          }
        } else if (track.kind === Track.Kind.Audio) {
          audioTrackRef.current = track;
          
          // Always attach to compact view initially
          if (videoRef.current) {
            track.attach(videoRef.current);
            console.log('[Viewer] Audio track attached to compact view');
          }
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

  // Detach/Attach tracks when expanding/collapsing
  useEffect(() => {
    if (!videoTrackRef.current && !audioTrackRef.current) return;
    
    console.log('[Viewer] Expansion state changed:', isExpanded);
    
    if (isExpanded && expandedVideoRef.current) {
      // Detach from compact view
      if (videoRef.current && videoTrackRef.current) {
        videoTrackRef.current.detach(videoRef.current);
      }
      if (videoRef.current && audioTrackRef.current) {
        audioTrackRef.current.detach(videoRef.current);
      }
      
      // Attach to expanded view
      if (videoTrackRef.current) {
        videoTrackRef.current.attach(expandedVideoRef.current);
        console.log('[Viewer] Video track attached to expanded view');
      }
      if (audioTrackRef.current) {
        audioTrackRef.current.attach(expandedVideoRef.current);
        console.log('[Viewer] Audio track attached to expanded view');
      }
      
      // Ensure playback
      expandedVideoRef.current.play().catch(err => 
        console.log('[Viewer] Autoplay prevented (expected):', err)
      );
    } else if (!isExpanded && videoRef.current) {
      // Detach from expanded view
      if (expandedVideoRef.current && videoTrackRef.current) {
        videoTrackRef.current.detach(expandedVideoRef.current);
      }
      if (expandedVideoRef.current && audioTrackRef.current) {
        audioTrackRef.current.detach(expandedVideoRef.current);
      }
      
      // Attach back to compact view
      if (videoTrackRef.current) {
        videoTrackRef.current.attach(videoRef.current);
        console.log('[Viewer] Video track attached to compact view');
      }
      if (audioTrackRef.current) {
        audioTrackRef.current.attach(videoRef.current);
        console.log('[Viewer] Audio track attached to compact view');
      }
    }
  }, [isExpanded]);

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
      setShowTipDialog(true);
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
      <div className="space-y-3">
        <div className="relative group">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full rounded-2xl border bg-black aspect-video shadow-xl" 
          />
          
          {/* Waiting for stream message */}
          {status === 'connected' && !hasVideoTrack && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent mb-3" />
                <p className="text-white text-sm font-medium">Waiting for stream...</p>
              </div>
            </div>
          )}

          {/* Status Indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full">
              <span className={`inline-block h-2 w-2 rounded-full ${
                status === 'connected' ? 'bg-green-500' : 
                status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500'
              }`} />
              <span className="text-white text-xs font-medium uppercase">{status}</span>
            </div>
            {status === 'connected' && viewerCount > 0 && (
              <div className="flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full">
                <span className="text-white text-xs font-medium">{viewerCount} watching</span>
              </div>
            )}
          </div>
        </div>

        {/* External Controls - Only show if enabled */}
        {showExternalControls && (
          <div className="flex gap-4 mt-4">
            <Button
              variant="secondary"
              onClick={() => setIsExpanded(true)}
              className="flex-1 min-w-[100px] h-11"
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Expand
            </Button>
            <Button
              variant="secondary"
              onClick={handleTip}
              className="flex-1 min-w-[100px] h-11"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Tip
            </Button>
            <Button
              variant="secondary"
              onClick={handleShare}
              className="flex-1 min-w-[100px] h-11"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        )}
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
                muted={false}
                className="w-full h-full" 
              />
              
              {/* Expanded Status & Viewer Count */}
              <div className="absolute top-4 left-4 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white text-sm font-medium">LIVE</span>
                </div>
                {viewerCount > 0 && (
                  <div className="flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full">
                    <span className="text-white text-sm font-medium">{viewerCount} watching</span>
                  </div>
                )}
              </div>
              
              {/* Share button in top right */}
              <div className="absolute top-4 right-4">
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
            <div className="border-l bg-background flex flex-col h-full">
              <LiveChat eventId={eventId} onTipRequest={handleTip} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Tip Dialog */}
      <TipDialog 
        open={showTipDialog} 
        onOpenChange={setShowTipDialog} 
        eventId={eventId}
      />
      
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800 mt-2">
          {error}
        </div>
      )}
    </>
  );
}
