import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Maximize2, DollarSign, Share2, Volume2, X, PictureInPicture2, Minimize2, Users } from 'lucide-react';
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
        console.log('[Viewer] Database status check:', data.status);
        setDatabaseStatus(data.status as 'live' | 'ended');
        
        // If database shows ended but we're still connected, disconnect
        if (data.status === 'ended' && status === 'connected') {
          console.log('[Viewer] Stream ended in database, disconnecting');
          disconnectStream();
        }
      }
    };

    // Check immediately
    checkStreamStatus();

    // Poll every 3 seconds for faster response
    const interval = setInterval(checkStreamStatus, 3000);

    return () => clearInterval(interval);
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

  // Calculate stream duration
  const streamDuration = streamStartTime 
    ? Math.floor((Date.now() - streamStartTime.getTime()) / 1000)
    : 0;
  const hours = Math.floor(streamDuration / 3600);
  const minutes = Math.floor((streamDuration % 3600) / 60);

  // Simple mode rendering - no expand for now
  return (
    <>
      <div className="space-y-3 relative">
        <div className="relative group">
          {/* Video Player */}
          <video 
            ref={videoRef}
            id="livekit-video"
            autoPlay 
            playsInline
            muted={false}
            controls
            className="w-full rounded-2xl border bg-black aspect-video shadow-xl object-contain"
          />

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

          {/* Live Badge & Viewer Count - Top Left - CRITICAL: Only show if BOTH connected AND database is live */}
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
          
          {/* Debug: Show status when NOT live */}
          {(status !== 'connected' || databaseStatus !== 'live') && (
            <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1.5 rounded-lg text-xs z-10">
              Status: {status} | DB: {databaseStatus || 'checking...'}
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

          {/* Quick Actions - PiP only for now */}
          {status === 'connected' && !showExternalControls && isPiPSupported && (
            <div className="absolute bottom-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="secondary"
                onClick={togglePiP}
                className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm"
              >
                <PictureInPicture2 className="h-4 w-4" />
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
            <Button onClick={handleShare} variant="outline" className="flex-1">
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
    </>
  );
}
