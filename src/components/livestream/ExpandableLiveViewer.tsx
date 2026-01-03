import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Maximize2, DollarSign, Share2, Volume2, X, PictureInPicture2, Minimize2, Users, MessageCircle } from 'lucide-react';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChatInFullscreen, setShowChatInFullscreen] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  
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

    // Attach tracks to the active video element without detaching to avoid flicker or unintended disconnects
    if (videoTrack) {
      console.log('[Viewer] Attaching video track');
      videoTrack.attach(activeVideoEl);
    }

    if (audioTrack) {
      console.log('[Viewer] Attaching audio track');
      audioTrack.attach(activeVideoEl);

      // Force audio playback with explicit volume control
      activeVideoEl.muted = false;
      activeVideoEl.volume = 1.0;
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

  // Connect to stream ONLY if we're not already connected
  useEffect(() => {
    // Only auto-connect if we're viewing the stream (user clicked "Join Stream")
    // and we're not already connected/connecting
    if (status === 'idle') {
      console.log('[Viewer] Initiating connection to event:', eventId);
      connectStream(eventId);
    }
  }, [eventId, connectStream]); // Remove status from deps to avoid reconnect loops

  // Subscribe to realtime database changes for immediate sync
  useEffect(() => {
    if (!eventId) return;

    console.log('[Viewer] Setting up realtime subscription for event:', eventId);

    const channel = supabase
      .channel(`livestream-viewer-${eventId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'livestream_events',
        filter: `id=eq.${eventId}`
      }, (payload) => {
        console.log('[Viewer] Realtime update received:', payload);
        const newStatus = payload.new?.status as 'live' | 'ended' | null;
        
        if (newStatus) {
          setDatabaseStatus(newStatus);
          
          // Immediately disconnect if stream ended
          if (newStatus === 'ended' && status === 'connected') {
            console.log('[Viewer] Stream ended via realtime, disconnecting immediately');
            toast.info("Stream has ended", {
              description: "Thanks for watching!"
            });
            disconnectStream();
          }
        }
      })
      .subscribe((subscribeStatus) => {
        console.log('[Viewer] Realtime subscription status:', subscribeStatus);
      });

    // Also poll as backup every 3 seconds
    const checkStreamStatus = async () => {
      const { data, error } = await supabase
        .from('livestream_events')
        .select('status')
        .eq('id', eventId)
        .single();

      if (!error && data) {
        console.log('[Viewer] Polling status check:', data.status);
        setDatabaseStatus(data.status as 'live' | 'ended');
        
        if (data.status === 'ended' && status === 'connected') {
          console.log('[Viewer] Stream ended (polling), disconnecting');
          disconnectStream();
        }
      }
    };

    checkStreamStatus();
    const interval = setInterval(checkStreamStatus, 3000);

    return () => {
      console.log('[Viewer] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [eventId, setDatabaseStatus, status, disconnectStream]);

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

  const handleFullscreen = () => {
    const container = fullscreenContainerRef.current;
    if (!container) return;

    const el = container as HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };

    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => undefined);
        setIsFullscreen(false);
      } else if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => undefined);
        setIsFullscreen(true);
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
        setIsFullscreen(true);
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('[Viewer] Fullscreen error:', err);
    }
  };

  // Listen for fullscreen changes (e.g., user presses Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Calculate stream duration
  const streamDuration = streamStartTime 
    ? Math.floor((Date.now() - streamStartTime.getTime()) / 1000)
    : 0;
  const hours = Math.floor(streamDuration / 3600);
  const minutes = Math.floor((streamDuration % 3600) / 60);
  
  // Expanded view with YouTube-style chat layout
  const expandedContent = (
    <div ref={fullscreenContainerRef} className={`flex flex-col h-full bg-background ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Main Video Area */}
        <div className={`flex-1 flex flex-col min-h-0 ${isFullscreen && !showChatInFullscreen ? 'w-full' : ''}`}>
          <div className="relative flex-1 bg-black overflow-hidden">
            <video 
              ref={videoRef}
              id="livekit-video-expanded"
              autoPlay 
              playsInline
              muted={false}
              className="w-full h-full object-contain"
            />
            
            {/* Status Overlay */}
            {status !== 'connected' && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <div className="text-center text-white space-y-4">
                  {status === 'connecting' && (
                    <>
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm">Connecting...</p>
                    </>
                  )}
                  {status === 'ended' && (
                    <div className="space-y-2">
                      <p className="text-xl font-bold">Stream Ended</p>
                      <p className="text-sm text-gray-300">Thanks for watching!</p>
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
            
            {/* Live Badge & Info Overlays */}
            {status === 'connected' && databaseStatus === 'live' && (
              <>
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-red-600 text-white px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold text-sm shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                </div>
                
                {streamDuration > 0 && (
                  <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm shadow-lg backdrop-blur-sm">
                    {hours > 0 && `${hours}:`}{String(minutes).padStart(2, '0')}:{String(streamDuration % 60).padStart(2, '0')}
                  </div>
                )}
              </>
            )}
            
            {/* Player Controls at Bottom - Always visible in fullscreen */}
            <div className={`absolute bottom-4 right-4 flex gap-2 z-20 transition-opacity ${isFullscreen ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
              {/* Chat Toggle Button - Only show in fullscreen */}
              {isFullscreen && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowChatInFullscreen(!showChatInFullscreen)}
                  className={`bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm ${showChatInFullscreen ? 'ring-2 ring-primary' : ''}`}
                  title={showChatInFullscreen ? 'Hide Chat' : 'Show Chat'}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={handleFullscreen}
                className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
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
            </div>
          </div>
        </div>
        
        {/* YouTube-Style Chat Sidebar - Visible on desktop, respects fullscreen toggle */}
        {!isMobile && (!isFullscreen || showChatInFullscreen) && (
          <div className={`w-80 lg:w-96 flex flex-col bg-muted/30 border-l border-border ${isFullscreen ? 'bg-background/95' : ''}`}>
            {/* Viewer Count Header */}
            <div className="flex-shrink-0 bg-background/80 backdrop-blur-sm px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{viewerCount}</span>
                  <span className="text-muted-foreground">watching now</span>
                </div>
                {isFullscreen && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowChatInFullscreen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Live Chat - Takes up remaining space */}
            <div className="flex-1 overflow-hidden">
              <ErrorBoundary>
                <LiveChat eventId={eventId} onTipRequest={handleTipClick} />
              </ErrorBoundary>
            </div>
            
            {/* Action Buttons + Reactions */}
            <div className="flex-shrink-0 p-4 space-y-3 bg-background/80 backdrop-blur-sm border-t border-border">
              {/* Reactions */}
              <div className="flex justify-center">
                <ErrorBoundary>
                  <LiveReactions eventId={eventId} streamStartTime={streamStartTime} />
                </ErrorBoundary>
              </div>
              
              {/* Tip & Share Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleTipClick} className="flex-1">
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
        )}
        
        {/* Mobile Drawer for Chat */}
        {isMobile && (
          <Drawer open={isExpanded} onOpenChange={setExpanded}>
            <DrawerContent className="h-[80vh]">
              <div className="flex flex-col h-full p-4 overflow-hidden">
                <div className="flex-1 mb-4 overflow-hidden">
                  <ErrorBoundary>
                    <LiveChat eventId={eventId} onTipRequest={handleTipClick} />
                  </ErrorBoundary>
                </div>
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <ErrorBoundary>
                        <LiveReactions eventId={eventId} streamStartTime={streamStartTime} />
                      </ErrorBoundary>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleTipClick} className="flex-1">
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
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </div>
  );
  
  // Compact view (default for LiveStudio page)
  const compactContent = (
    <div className="space-y-3 relative">
      <div className="relative group">
        <video 
          ref={videoRef}
          id="livekit-video"
          autoPlay 
          playsInline
          muted={false}
          controls
          className="w-full rounded-2xl border bg-black aspect-video shadow-xl object-contain"
        />

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
        
        {(status !== 'connected' || databaseStatus !== 'live') && (
          <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1.5 rounded-lg text-xs z-10">
            Status: {status} | DB: {databaseStatus || 'checking...'}
          </div>
        )}

        {status === 'connected' && streamDuration > 0 && (
          <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm shadow-lg backdrop-blur-sm">
            {hours > 0 && `${hours}:`}{String(minutes).padStart(2, '0')}:{String(streamDuration % 60).padStart(2, '0')}
          </div>
        )}

        {status === 'connected' && (
          <div className="absolute right-4 bottom-20 z-10">
            <LiveReactions eventId={eventId} streamStartTime={streamStartTime} />
          </div>
        )}

        {status === 'connected' && !showExternalControls && (
          <div className="absolute bottom-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleFullscreen}
              className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
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
          </div>
        )}
      </div>

      {showExternalControls && status === 'connected' && (
        <div className="flex gap-2 justify-center">
          <Button onClick={handleTipClick} variant="default" className="flex-1 rounded-button">
            <DollarSign className="h-4 w-4 mr-2" />
            Send Tip
          </Button>
          <Button onClick={handleShare} variant="outline" className="flex-1 rounded-button">
            <Share2 className="h-4 w-4 mr-2" />
            Share
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
  );
  
  // Render expanded or compact based on isExpanded state
  return isExpanded ? (
    <Dialog open={isExpanded} onOpenChange={setExpanded}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        {expandedContent}
      </DialogContent>
    </Dialog>
  ) : (
    compactContent
  );
}
