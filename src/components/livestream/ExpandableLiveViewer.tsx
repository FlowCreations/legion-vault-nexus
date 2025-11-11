import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Room, RoomEvent, Track, RemoteTrack, RemoteVideoTrack, RemoteAudioTrack } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Maximize2, DollarSign, Share2, Volume2 } from 'lucide-react';
import { LiveChat } from './LiveChat';
import { TipDialog } from './TipDialog';
import { LiveReactions } from './LiveReactions';
import { toast } from 'sonner';

type Props = { 
  eventId: string;
  streamStartTime?: Date;
  onTip?: () => void;
  onShare?: () => void;
  showExternalControls?: boolean;
};

export function ExpandableLiveViewer({ eventId, streamStartTime, onTip, onShare, showExternalControls = false }: Props) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);
  const [hasAudioTrack, setHasAudioTrack] = useState(false);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [audioMuted, setAudioMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const expandedVideoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const videoTrackRef = useRef<RemoteVideoTrack | null>(null);
  const audioTrackRef = useRef<RemoteAudioTrack | null>(null);

  // Attach video and audio tracks to the active element
  const attachTracks = useCallback(() => {
    const activeVideoEl = isExpanded ? expandedVideoRef.current : videoRef.current;
    
    console.log('[Viewer] Attaching tracks:', {
      isExpanded,
      hasVideo: !!videoTrackRef.current,
      hasAudio: !!audioTrackRef.current,
      activeVideoEl: !!activeVideoEl
    });
    
    if (!activeVideoEl) {
      console.warn('[Viewer] No active video element');
      return;
    }

    // Attach video track using LiveKit's attach method
    if (videoTrackRef.current) {
      console.log('[Viewer] Attaching video track');
      videoTrackRef.current.attach(activeVideoEl);
      
      // Ensure playback
      activeVideoEl.play().catch(err => 
        console.log('[Viewer] Video play prevented:', err.message)
      );
    }

    // Attach audio track directly to the video element (LiveKit handles this)
    if (audioTrackRef.current) {
      console.log('[Viewer] Attaching audio track');
      audioTrackRef.current.attach(activeVideoEl);
      
      // Force audio playback with explicit volume control
      activeVideoEl.muted = false;
      activeVideoEl.volume = 1.0;
      
      // Trigger play to ensure audio context starts
      activeVideoEl.play().catch(err => {
        console.warn('[Viewer] Audio autoplay prevented:', err.message);
        // Show unmute button to user
        setAudioMuted(true);
      });
    }
  }, [isExpanded]);

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
        console.log('[Viewer] Track subscribed:', {
          kind: track.kind,
          participant: participant.identity,
          sid: track.sid
        });
        
        if (track.kind === Track.Kind.Video && track instanceof RemoteVideoTrack) {
          console.log('[Viewer] Storing video track');
          videoTrackRef.current = track;
          setHasVideoTrack(true);
          
          // Attach immediately to current view
          setTimeout(() => attachTracks(), 100);
        } else if (track.kind === Track.Kind.Audio && track instanceof RemoteAudioTrack) {
          console.log('[Viewer] Storing audio track');
          audioTrackRef.current = track;
          setHasAudioTrack(true);
          
          // Attach immediately to current view
          setTimeout(() => attachTracks(), 100);
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
    
    // Detach tracks before disconnecting
    if (videoTrackRef.current) {
      const activeVideoEl = isExpanded ? expandedVideoRef.current : videoRef.current;
      if (activeVideoEl) {
        videoTrackRef.current.detach(activeVideoEl);
      }
      videoTrackRef.current = null;
    }
    
    if (audioTrackRef.current) {
      const activeVideoEl = isExpanded ? expandedVideoRef.current : videoRef.current;
      if (activeVideoEl) {
        audioTrackRef.current.detach(activeVideoEl);
      }
      audioTrackRef.current = null;
    }
    
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    
    setHasVideoTrack(false);
    setHasAudioTrack(false);
    setStatus('idle');
  };

  // Re-attach tracks when expanding/collapsing
  useEffect(() => {
    if (!isExpanded && !videoTrackRef.current && !audioTrackRef.current) {
      // No tracks yet, nothing to do
      return;
    }
    
    console.log('[Viewer] View mode changed (isExpanded=' + isExpanded + '), re-attaching tracks');
    
    // Detach from old element
    const oldVideoEl = isExpanded ? videoRef.current : expandedVideoRef.current;
    if (oldVideoEl) {
      if (videoTrackRef.current) {
        videoTrackRef.current.detach(oldVideoEl);
      }
      if (audioTrackRef.current) {
        audioTrackRef.current.detach(oldVideoEl);
      }
    }
    
    // Attach to new element
    setTimeout(() => attachTracks(), 100);
  }, [isExpanded, attachTracks]);

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

  // Force volume to 1.0 when audio track is available
  useEffect(() => {
    if (hasAudioTrack) {
      if (videoRef.current) videoRef.current.volume = 1.0;
      if (expandedVideoRef.current) expandedVideoRef.current.volume = 1.0;
    }
  }, [hasAudioTrack]);

  // Audio diagnostic logging - runs every 2 seconds when connected
  useEffect(() => {
    if (status !== 'connected' || !hasAudioTrack) return;
    
    const interval = setInterval(() => {
      const activeVideoEl = isExpanded ? expandedVideoRef.current : videoRef.current;
      if (activeVideoEl) {
        console.log('[Audio Debug]', {
          volume: activeVideoEl.volume,
          muted: activeVideoEl.muted,
          paused: activeVideoEl.paused,
          hasAudioTrack: !!audioTrackRef.current,
          audioTrackEnabled: audioTrackRef.current?.mediaStreamTrack?.enabled
        });
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [status, hasAudioTrack, isExpanded]);

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

  const handleUnmute = () => {
    const activeVideoEl = isExpanded ? expandedVideoRef.current : videoRef.current;
    if (activeVideoEl) {
      activeVideoEl.muted = false;
      activeVideoEl.volume = 1.0;
      activeVideoEl.play().catch(err => 
        console.error('[Viewer] Error unmuting audio:', err)
      );
    }
    setAudioMuted(false);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="relative group">
          <video 
            ref={videoRef}
            id="compact-video"
            autoPlay 
            playsInline
            muted={false}
            controls
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

          {/* Unmute Audio Button - Show if browser blocks autoplay */}
          {hasAudioTrack && audioMuted && status === 'connected' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              <Button
                onClick={handleUnmute}
                size="lg"
                className="bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg"
              >
                <Volume2 className="w-5 h-5 mr-2" />
                Unmute Audio
              </Button>
            </div>
          )}

          {/* Live Reactions Overlay */}
          {status === 'connected' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
              <LiveReactions eventId={eventId} streamStartTime={streamStartTime} />
            </div>
          )}
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
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] h-full gap-0">
            {/* Video Player */}
            <div className="relative bg-black flex items-center justify-center">
              <video 
                ref={expandedVideoRef}
                id="expanded-video"
                autoPlay 
                playsInline
                muted={false}
                controls
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

              {/* Unmute Audio Button - Expanded View */}
              {hasAudioTrack && audioMuted && status === 'connected' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                  <Button
                    onClick={handleUnmute}
                    size="lg"
                    className="bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg"
                  >
                    <Volume2 className="w-5 h-5 mr-2" />
                    Unmute Audio
                  </Button>
                </div>
              )}

              {/* Live Reactions Overlay - Expanded View */}
              {status === 'connected' && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                  <LiveReactions eventId={eventId} streamStartTime={streamStartTime} />
                </div>
              )}
            </div>
            
            {/* Live Chat Sidebar */}
            <div className="border-l lg:border-l bg-background flex flex-col h-full min-h-0">
              <div className="px-4 py-3 border-b bg-muted/30">
                <h3 className="font-semibold text-sm">Live Chat</h3>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <LiveChat eventId={eventId} onTipRequest={handleTip} />
              </div>
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
