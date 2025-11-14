import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Maximize2, DollarSign, Share2, Volume2, X, PictureInPicture2, Minimize2 } from 'lucide-react';
import { LiveChat } from './LiveChat';
import { TipDialog } from './TipDialog';
import { LiveReactions } from './LiveReactions';
import { StreamHighlights } from './StreamHighlights';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePictureInPicture } from '@/hooks/usePictureInPicture';
import { useLiveStreamStore } from '@/stores/liveStreamStore';

type Props = { 
  eventId: string;
  streamStartTime?: Date;
  onTip?: () => void;
  onShare?: () => void;
  showExternalControls?: boolean;
};

export function ExpandableLiveViewer({ 
  eventId, 
  streamStartTime, 
  onTip, 
  onShare, 
  showExternalControls = false
}: Props) {
  const isMobile = useIsMobile();
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [audioMuted, setAudioMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Global stream state
  const { 
    status, 
    error, 
    viewerCount, 
    hasVideoTrack, 
    hasAudioTrack,
    videoTrack,
    audioTrack,
    isExpanded,
    setExpanded,
    connect: connectStream,
    disconnect: disconnectStream
  } = useLiveStreamStore();
  
  // Picture-in-Picture support
  const { isPiPActive, isPiPSupported, togglePiP, enterPiP } = usePictureInPicture(videoRef);

  // Attach video and audio tracks to the single video element
  const attachTracks = useCallback(() => {
    const activeVideoEl = videoRef.current;
    
    console.log('[Viewer] Attaching tracks:', {
      hasVideo: !!videoTrack,
      hasAudio: !!audioTrack,
      activeVideoEl: !!activeVideoEl
    });
    
    if (!activeVideoEl) {
      console.warn('[Viewer] No active video element');
      return;
    }

    // Attach video track using LiveKit's attach method
    if (videoTrack) {
      console.log('[Viewer] Attaching video track');
      videoTrack.attach(activeVideoEl);
      
      // Ensure playback
      activeVideoEl.play().catch(err => 
        console.log('[Viewer] Video play prevented:', err.message)
      );
    }

    // Attach audio track directly to the video element (LiveKit handles this)
    if (audioTrack) {
      console.log('[Viewer] Attaching audio track');
      audioTrack.attach(activeVideoEl);
      
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
  }, [videoTrack, audioTrack]);

  // Connect to stream on mount
  useEffect(() => {
    if (status === 'idle') {
      console.log('[Viewer] Initiating connection to event:', eventId);
      connectStream(eventId);
    }
  }, [eventId, status, connectStream]);

  // Attach tracks when they become available
  useEffect(() => {
    if ((videoTrack || audioTrack) && videoRef.current) {
      attachTracks();
    }
  }, [videoTrack, audioTrack, attachTracks]);

  // Auto Picture-in-Picture when navigating away
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && videoRef.current && status === 'connected' && isPiPSupported) {
        try {
          await enterPiP();
          console.log('[Viewer] Entered PiP on navigation');
        } catch (err) {
          console.log('[Viewer] PiP not available:', err);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status, isPiPSupported, enterPiP]);

  const handleExpandChange = (expanded: boolean) => {
    setExpanded(expanded);
  };

  const handleTipClick = () => {
    if (onTip) {
      onTip();
    } else {
      setShowTipDialog(true);
    }
  };

  const handleShareClick = () => {
    if (onShare) {
      onShare();
    } else {
      toast.info("Share feature coming soon!");
    }
  };

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      setAudioMuted(false);
      
      videoRef.current.play().catch(err => {
        console.warn('[Viewer] Play prevented after unmute:', err);
      });
    }
  };

  // Calculate stream duration
  const streamDuration = streamStartTime 
    ? Math.floor((Date.now() - streamStartTime.getTime()) / 1000)
    : 0;
  const hours = Math.floor(streamDuration / 3600);
  const minutes = Math.floor((streamDuration % 3600) / 60);

  // Single video element used in both modes
  const videoElement = (
    <video 
      ref={videoRef}
      id="livekit-video"
      autoPlay 
      playsInline
      muted={false}
      controls
      className={isExpanded 
        ? "w-full h-full object-contain bg-black" 
        : "w-full rounded-2xl border bg-black aspect-video shadow-xl"
      }
    />
  );

  // Compact mode rendering
  if (!isExpanded) {
    return (
      <div className="space-y-3">
        <div className="relative group">
          {/* Video Container */}
          {videoElement}

          {/* Stream Status Overlay */}
          {status !== 'connected' && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-2xl border">
              <div className="text-center text-white space-y-4">
                {status === 'connecting' && (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm">Connecting to stream...</p>
                  </>
                )}
                {status === 'ended' && (
                  <div className="space-y-2">
                    <p className="text-xl font-bold">Stream Ended</p>
                    <p className="text-sm text-gray-300">Thank you for watching!</p>
                  </div>
                )}
                {status === 'error' && error && (
                  <div className="space-y-2 text-red-400">
                    <p className="text-xl font-bold">Connection Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Badge & Viewer Count - Top Left */}
          {status === 'connected' && (
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <div className="bg-red-600 text-white px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold text-sm shadow-lg backdrop-blur-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                LIVE
              </div>
              <div className="bg-black/60 text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-sm shadow-lg backdrop-blur-sm">
                <span className="text-primary">👁️</span>
                {viewerCount}
              </div>
            </div>
          )}

          {/* Duration - Top Right */}
          {status === 'connected' && streamDuration > 0 && (
            <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm shadow-lg backdrop-blur-sm">
              {hours > 0 && `${hours}:`}{String(minutes).padStart(2, '0')}:{String(streamDuration % 60).padStart(2, '0')}
            </div>
          )}

          {/* Reactions Overlay - Right Side */}
          {status === 'connected' && (
            <div className="absolute right-4 bottom-20 z-10">
              <LiveReactions eventId={eventId} />
            </div>
          )}

          {/* Unmute Button */}
          {audioMuted && hasAudioTrack && status === 'connected' && (
            <Button
              size="sm"
              onClick={handleUnmute}
              className="absolute bottom-4 left-4 bg-yellow-500/90 hover:bg-yellow-600 text-white z-10"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Tap to Unmute
            </Button>
          )}

          {/* Quick Actions - Bottom Right */}
          {status === 'connected' && (
            <div className="absolute bottom-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              {isPiPSupported && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={togglePiP}
                  className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
                >
                  <PictureInPicture2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleExpandChange(true)}
                className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* External Controls */}
        {showExternalControls && status === 'connected' && (
          <div className="flex gap-2 justify-center">
            <Button onClick={handleTipClick} variant="default" className="flex-1">
              <DollarSign className="h-4 w-4 mr-2" />
              Send Tip
            </Button>
            <Button onClick={handleShareClick} variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button onClick={() => handleExpandChange(true)} variant="outline" className="flex-1">
              <Maximize2 className="h-4 w-4 mr-2" />
              Expand
            </Button>
          </div>
        )}

        <TipDialog 
          eventId={eventId}
          open={showTipDialog} 
          onOpenChange={setShowTipDialog}
        />
      </div>
    );
  }

  // Expanded mode rendering
  if (isMobile) {
    return (
      <Drawer open={isExpanded} onOpenChange={handleExpandChange}>
        <DrawerContent className="h-[95vh]">
          <div className="flex flex-col h-full">
            {/* Video Section */}
            <div className="relative flex-1 bg-black">
              {videoElement}

              {/* Live Badge */}
              {status === 'connected' && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold text-sm shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  LIVE
                </div>
              )}

              {/* Close Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleExpandChange(false)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat & Actions */}
            <div className="border-t bg-background">
              <LiveChat eventId={eventId} onTipRequest={handleTipClick} />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop expanded mode
  return (
    <Dialog open={isExpanded} onOpenChange={handleExpandChange}>
      <DialogContent 
        className="max-w-[98vw] w-[98vw] h-[95vh] p-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          handleExpandChange(false);
        }}
      >
        <div className="flex h-full">
          {/* Video Section */}
          <div className="flex-1 bg-black relative flex items-center justify-center">
            {videoElement}

            {/* Live Badge & Viewer Count */}
            {status === 'connected' && (
              <div className="absolute top-6 left-6 flex items-center gap-3 z-10">
                <div className="bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 font-semibold shadow-lg backdrop-blur-sm">
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                  LIVE
                </div>
                <div className="bg-black/60 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-sm">
                  <span className="text-primary">👁️</span>
                  {viewerCount} watching
                </div>
              </div>
            )}

            {/* Duration */}
            {status === 'connected' && streamDuration > 0 && (
              <div className="absolute top-6 right-6 bg-black/60 text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm">
                {hours > 0 && `${hours}:`}{String(minutes).padStart(2, '0')}:{String(streamDuration % 60).padStart(2, '0')}
              </div>
            )}

            {/* Reactions */}
            {status === 'connected' && (
              <div className="absolute right-6 bottom-24 z-10">
                <LiveReactions eventId={eventId} />
              </div>
            )}

            {/* Minimize Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleExpandChange(false)}
              className="absolute bottom-6 left-6 bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
            >
              <Minimize2 className="h-4 w-4 mr-2" />
              Minimize
            </Button>

            {/* PiP Button */}
            {isPiPSupported && (
              <Button
                size="sm"
                variant="ghost"
                onClick={togglePiP}
                className="absolute bottom-6 left-32 bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
              >
                <PictureInPicture2 className="h-4 w-4 mr-2" />
                Picture-in-Picture
              </Button>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-[380px] border-l bg-background flex flex-col">
            {/* Chat */}
            <div className="flex-1 overflow-hidden">
              <LiveChat eventId={eventId} onTipRequest={handleTipClick} />
            </div>

            {/* Highlights */}
            <div className="border-t p-4">
              <StreamHighlights eventId={eventId} />
            </div>

            {/* Action Buttons */}
            <div className="border-t p-4 flex gap-2">
              <Button onClick={handleTipClick} className="flex-1">
                <DollarSign className="h-4 w-4 mr-2" />
                Send Tip
              </Button>
              <Button onClick={handleShareClick} variant="outline" className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
      
      <TipDialog 
        eventId={eventId}
        open={showTipDialog} 
        onOpenChange={setShowTipDialog}
      />
    </Dialog>
  );
}
