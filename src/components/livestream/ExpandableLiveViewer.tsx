import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
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
import { ErrorBoundary } from '@/diagnostics/ErrorBoundary';
import { supabase } from '@/integrations/supabase/client';

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
    databaseStatus,
    setExpanded,
    setDatabaseStatus,
    connect: connectStream,
    disconnect: disconnectStream
  } = useLiveStreamStore();
  
  // Picture-in-Picture support
  const { isPiPActive, isPiPSupported, togglePiP, enterPiP } = usePictureInPicture(videoRef);

  // Attach video and audio tracks to the single video element with guards
  const attachTracks = useCallback(() => {
    const activeVideoEl = videoRef.current;
    
    console.log('[Viewer] Attaching tracks:', {
      hasVideo: !!videoTrack,
      hasAudio: !!audioTrack,
      activeVideoEl: !!activeVideoEl,
      isExpanded,
      inDOM: activeVideoEl ? document.body.contains(activeVideoEl) : false
    });
    
    if (!activeVideoEl) {
      console.warn('[Viewer] No video element');
      return;
    }

    // Ensure element is actually in the DOM
    if (!document.body.contains(activeVideoEl)) {
      console.warn('[Viewer] Video element not in DOM yet, retrying...');
      setTimeout(() => attachTracks(), 100);
      return;
    }

    // Detach tracks completely before re-attaching to new container
    if (videoTrack) {
      console.log('[Viewer] Detaching and re-attaching video track');
      videoTrack.detach(); // Cleanup any previous attachment
      // Small delay to ensure detachment completes
      setTimeout(() => {
        if (activeVideoEl && document.body.contains(activeVideoEl)) {
          videoTrack.attach(activeVideoEl);
        }
      }, 50);
    }

    // Detach and re-attach audio track
    if (audioTrack) {
      console.log('[Viewer] Detaching and re-attaching audio track');
      audioTrack.detach(); // Cleanup any previous attachment
      setTimeout(() => {
        if (activeVideoEl && document.body.contains(activeVideoEl)) {
          audioTrack.attach(activeVideoEl);
          
          // Force audio playback with explicit volume control
          activeVideoEl.muted = false;
          activeVideoEl.volume = 1.0;
        }
      }, 50);
    }

    // Ensure playback starts
    setTimeout(() => {
      if (activeVideoEl && document.body.contains(activeVideoEl)) {
        activeVideoEl.play().catch(err => {
          console.log('[Viewer] Autoplay prevented:', err.message);
          setAudioMuted(true);
        });
      }
    }, 100);
  }, [videoTrack, audioTrack, isExpanded]);

  // Connect to stream on mount
  useEffect(() => {
    if (status === 'idle') {
      console.log('[Viewer] Initiating connection to event:', eventId);
      connectStream(eventId);
    }
  }, [eventId, status, connectStream]);

  // Poll database for stream status to detect when stream ends
  useEffect(() => {
    if (!eventId) return;

    const checkStreamStatus = async () => {
      const { data, error } = await supabase
        .from('livestream_events')
        .select('status')
        .eq('id', eventId)
        .single();

      if (!error && data) {
        setDatabaseStatus(data.status as 'live' | 'ended');
      }
    };

    // Check immediately
    checkStreamStatus();

    // Then poll every 5 seconds
    const interval = setInterval(checkStreamStatus, 5000);

    return () => clearInterval(interval);
  }, [eventId, setDatabaseStatus]);

  // Attach tracks when they become available OR when expanded state changes
  useEffect(() => {
    if ((videoTrack || audioTrack) && videoRef.current) {
      // Small delay to ensure DOM is ready after expand/collapse
      const timer = setTimeout(() => {
        attachTracks();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [videoTrack, audioTrack, isExpanded, attachTracks]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('[Viewer] State Update:', {
      isExpanded,
      status,
      hasVideo: hasVideoTrack,
      hasAudio: hasAudioTrack,
      videoRefExists: !!videoRef.current,
      videoRefInDOM: videoRef.current ? document.body.contains(videoRef.current) : false
    });
  }, [isExpanded, status, hasVideoTrack, hasAudioTrack]);

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

  const handleTipClick = () => {
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
      <>
        <div className="space-y-3 relative">
          <div className="relative group">
            {/* Video Container */}

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

          {/* Live Badge & Viewer Count - Top Left - Only show if connected AND database shows live */}
          {status === 'connected' && databaseStatus === 'live' && (
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

          {/* Quick Actions - Bottom Right (only on hover and when not showing external controls) */}
          {status === 'connected' && !showExternalControls && (
            <div className="absolute bottom-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
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
              onClick={() => setExpanded(true)}
              className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm rounded-md"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            </div>
          )}
        </div>

        {/* External Controls - Only show when NOT expanded */}
        {showExternalControls && status === 'connected' && !isExpanded && (
          <div className="flex gap-2 justify-center">
            <Button onClick={handleTipClick} variant="default" className="flex-1">
              <DollarSign className="h-4 w-4 mr-2" />
              Send Tip
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button onClick={() => setExpanded(true)} variant="outline" className="flex-1">
              <Maximize2 className="h-4 w-4 mr-2" />
              Expand
            </Button>
          </div>
        )}

        <ErrorBoundary>
          <TipDialog 
            eventId={eventId}
            open={showTipDialog} 
            onOpenChange={setShowTipDialog}
          />
        </ErrorBoundary>
      </div>
      </>
    );
  }

  // Mobile expanded mode
  if (isMobile) {
    return (
      <>
        <Drawer open={isExpanded} onOpenChange={setExpanded}>
          <DrawerContent className="h-[90vh] bg-background">
            <div className="flex flex-col h-full">
              {/* Video Area */}
              <div className="relative bg-black aspect-video">
                {/* Permanent Video Element - Rendered via Portal */}
                <div id="video-container-permanent-mobile" className="w-full h-full" />
                
                {/* Close Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpanded(false)}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white z-10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Info message - Chat and Tips disabled in expanded mode */}
              <div className="p-4 bg-yellow-500/10 border-t border-yellow-500/20">
                <p className="text-sm text-yellow-500 text-center">
                  Chat and tips are disabled in expanded view
                </p>
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Tip Dialog */}
        <ErrorBoundary>
          <TipDialog 
            eventId={eventId}
            open={showTipDialog} 
            onOpenChange={setShowTipDialog}
          />
        </ErrorBoundary>
      </>
    );
  }

  // Desktop expanded mode
  return (
    <>
      <Dialog open={isExpanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-none w-screen h-screen p-0 gap-0 bg-black border-0">
          <div className="h-full flex flex-col lg:flex-row">
            {/* Main Video Area */}
            <div className="flex-1 relative flex items-center justify-center bg-black">
              {/* Permanent Video Element - Rendered via Portal */}
              <div id="video-container-permanent" className="w-full h-full" />
              
              {/* Stream Status Overlays */}
              {status === 'connecting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-white text-center">
                    <div className="animate-pulse mb-2">Connecting to stream...</div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-white text-center max-w-md px-4">
                    <p className="text-red-400 mb-2">Connection Error</p>
                    <p className="text-sm text-gray-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Minimize Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpanded(false)}
                className="absolute bottom-6 left-6 bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm z-10"
              >
                <Minimize2 className="h-4 w-4 mr-2" />
                Minimize
              </Button>
            </div>

            {/* Sidebar - Live Chat & Controls (like YouTube fullscreen) */}
            <div className="w-full lg:w-96 bg-background border-l border-border flex flex-col">
              {/* Stream Info Header */}
              <div className="p-4 border-b border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {status === 'connected' && databaseStatus === 'live' && (
                      <div className="bg-red-600 text-white px-2 py-1 rounded-full flex items-center gap-1.5 font-semibold text-xs">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        LIVE
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span>👁️</span>
                      <span>{viewerCount} viewers</span>
                    </div>
                  </div>
                  {streamDuration > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {hours > 0 && `${hours}:`}{String(minutes).padStart(2, '0')}:{String(streamDuration % 60).padStart(2, '0')}
                    </div>
                  )}
                </div>
              </div>

              {/* Live Chat - Scrollable */}
              <div className="flex-1 overflow-hidden">
                <ErrorBoundary>
                  <LiveChat eventId={eventId} />
                </ErrorBoundary>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-border space-y-3">
                {/* Reaction Buttons */}
                <div className="flex justify-center">
                  <ErrorBoundary>
                    <LiveReactions eventId={eventId} />
                  </ErrorBoundary>
                </div>
                
                {/* Tip & Share Buttons */}
                <div className="flex gap-2">
                  <Button onClick={handleTipClick} variant="default" className="flex-1">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Send Tip
                  </Button>
                  <Button onClick={handleShare} variant="outline" className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tip Dialog */}
      <ErrorBoundary>
        <TipDialog 
          eventId={eventId}
          open={showTipDialog} 
          onOpenChange={setShowTipDialog}
        />
      </ErrorBoundary>

      {/* Video Element Portal - Single permanent video that never unmounts */}
      {typeof window !== 'undefined' && ReactDOM.createPortal(
        <video 
          ref={videoRef}
          id="livekit-video-permanent"
          autoPlay 
          playsInline
          muted={false}
          className="w-full h-full object-contain bg-black"
        />,
        // Render into the appropriate container based on expand state and device
        isExpanded 
          ? (isMobile 
              ? document.getElementById('video-container-permanent-mobile') || document.body
              : document.getElementById('video-container-permanent') || document.body)
          : videoRef.current?.parentElement || document.body
      )}
    </>
  );
}
