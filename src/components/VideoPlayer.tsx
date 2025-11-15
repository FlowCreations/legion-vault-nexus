import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X, ChevronDown, Volume2, VolumeX, SkipBack, SkipForward, Maximize, Minimize, Heart, Share2, Link, Mail, Facebook, Twitter, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEventTracking } from "@/hooks/useEventTracking";
import { VideoComments } from "@/components/video/VideoComments";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VideoPlayerProps {
  videoId: string;
  videoUrl: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

export function VideoPlayer({ 
  videoId,
  videoUrl, 
  title, 
  description,
  thumbnailUrl,
  isOpen, 
  onClose,
  category 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const idleTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { trackEvent } = useEventTracking();
  const watchStartTime = useRef<number>(0);

  // Determine if video should be portrait (vertical) based on category
  const isPortraitVideo = category === 'behind_the_scenes' || category === 'performances';
  const shouldBeFullscreen = category === 'music_videos' || category === 'documentary';
  const bottomOffset = `calc(env(safe-area-inset-bottom, 0px) + 16px)`;

  // Auto-hide UI when playing and user is idle
  const kickIdleTimer = () => {
    if (idleTimeout.current) clearTimeout(idleTimeout.current);
    if (isPlaying && !minimized) {
      setShowUI(true);
      idleTimeout.current = setTimeout(() => setShowUI(false), 2500);
    } else {
      setShowUI(true);
    }
  };

  useEffect(() => {
    const onMove = () => kickIdleTimer();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("keydown", onMove);
    window.addEventListener("touchstart", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onMove);
      window.removeEventListener("touchstart", onMove);
    };
  }, [isPlaying, minimized]);

  // Keyboard controls (spacebar to pause/play)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with typing in input fields
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'INPUT') {
        return;
      }
      
      if (e.code === 'Space' && isOpen && !minimized) {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, minimized]);

  // Check if video is favorited
  useEffect(() => {
    const checkFavorite = async () => {
      if (!videoId) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('video_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .maybeSingle();

      setIsFavorited(!!data);
    };

    if (isOpen) {
      checkFavorite();
    }
  }, [isOpen, videoId]);

  // Auto-play when opened
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      setMinimized(false);
      kickIdleTimer();
      
      // Track video start
      watchStartTime.current = Date.now();
      trackEvent('video_view', { 
        video_id: videoId,
        title: title,
        category: category
      });
    }
  }, [isOpen]);

  const onTimeUpdate = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    setProgress(v.currentTime);
    setDuration(v.duration || 0);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
      setShowUI(true);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const value = Number(e.target.value);
    v.currentTime = value;
    setProgress(value);
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const fmt = (t: number) => {
    if (!isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleClose = () => {
    // Track watch duration before closing
    if (watchStartTime.current > 0) {
      const watchDuration = Math.floor((Date.now() - watchStartTime.current) / 1000);
      trackEvent('video_watch', {
        video_id: videoId,
        title: title,
        duration: watchDuration,
        completed: progress >= duration * 0.9 // 90% completion
      });
      watchStartTime.current = 0;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
    setMinimized(false);
    onClose();
  };

  const toggleFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ description: "Please sign in to favorite videos", variant: "destructive" });
      return;
    }

    if (isFavorited) {
      // Remove from favorites
      const { error } = await supabase
        .from('video_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);

      if (error) {
        toast({ description: "Failed to remove favorite", variant: "destructive" });
      } else {
        setIsFavorited(false);
        toast({ description: "Removed from favorites" });
      }
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('video_favorites')
        .insert({ user_id: user.id, video_id: videoId });

      if (error) {
        toast({ description: "Failed to add favorite", variant: "destructive" });
      } else {
        setIsFavorited(true);
        toast({ description: "Added to favorites" });
      }
    }
  };

  const copyToClipboard = async () => {
    const shareUrl = `${window.location.origin}/videos?v=${videoId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ description: "Link copied to clipboard" });
    } catch (err) {
      toast({ description: "Failed to copy link", variant: "destructive" });
    }
  };

  const shareViaEmail = () => {
    const shareUrl = `${window.location.origin}/videos?v=${videoId}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this video: ${shareUrl}`)}`;
  };

  const shareViaTwitter = () => {
    const shareUrl = `${window.location.origin}/videos?v=${videoId}`;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`, '_blank');
  };

  const shareViaFacebook = () => {
    const shareUrl = `${window.location.origin}/videos?v=${videoId}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div
      className={isFullscreen 
        ? "fixed inset-0 z-[60] bg-black" 
        : "fixed left-1/2 -translate-x-1/2 z-[60] w-full max-w-5xl px-4"
      }
      style={isFullscreen ? undefined : { bottom: bottomOffset }}
    >
      {/* Minimized pill - only show when not fullscreen */}
      <AnimatePresence>
        {minimized && !isFullscreen && (
          <motion.button
            key="pill"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            onClick={() => setMinimized(false)}
            className="mx-auto block rounded-full shadow-lg backdrop-blur bg-black/40 text-white px-4 py-2 text-sm hover:bg-black/60"
          >
            <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4 rotate-180" />
              <span>Show player</span>
              {title && <span className="opacity-80">– {title}</span>}
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main player card */}
      <AnimatePresence>
        {!minimized && (
          <motion.div
            key="card"
            ref={containerRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className={isFullscreen 
              ? "w-full h-full bg-black flex flex-col" 
              : "rounded-2xl shadow-2xl overflow-hidden bg-zinc-900/80 backdrop-blur border border-white/10"
            }
            onMouseMove={kickIdleTimer}
          >
            <div 
              className={isFullscreen 
                ? "relative w-full h-full flex items-center justify-center bg-black" 
                : isPortraitVideo
                  ? "relative w-full max-w-md mx-auto aspect-[9/16] bg-black"
                  : "relative w-full bg-black"
              }
              onClick={togglePlay}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                poster={thumbnailUrl}
                playsInline
                className={isFullscreen 
                  ? "w-full h-full object-contain" 
                  : isPortraitVideo 
                    ? "w-full h-full object-contain" 
                    : shouldBeFullscreen
                      ? "w-full h-[60vh] md:h-[70vh] object-contain bg-black"
                      : "w-full h-[42vh] md:h-[50vh] object-cover"
                }
                onTimeUpdate={onTimeUpdate}
                onPlay={() => { setIsPlaying(true); kickIdleTimer(); }}
                onPause={() => { setIsPlaying(false); setShowUI(true); }}
                onLoadedMetadata={onTimeUpdate}
                controls={false}
              />

              {/* Auto-hide chrome */}
              <AnimatePresence>
                {showUI && (
                  <motion.div
                    key="chrome"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={isFullscreen 
                      ? "absolute inset-x-0 bottom-0 p-4 md:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent" 
                      : "absolute inset-x-0 bottom-0 p-3 md:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent"
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-3">
                      {/* Title - hide in fullscreen when UI is hidden */}
                      {(!isFullscreen || showUI) && (
                        <div>
                          <h3 className="font-semibold text-white text-sm md:text-base">{title}</h3>
                          <p className="text-xs text-white/70">{description}</p>
                        </div>
                      )}
                      {/* Progress bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-white text-xs tabular-nums w-10 text-right">{fmt(progress)}</span>
                        <input
                          type="range"
                          min={0}
                          max={duration || 0}
                          step={0.1}
                          value={progress}
                          onChange={onSeek}
                          className="w-full accent-white"
                        />
                        <span className="text-white text-xs tabular-nums w-10">{fmt(duration)}</span>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => skip(-10)}
                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                            aria-label="Skip back 10s"
                          >
                            <SkipBack className="w-4 h-4"/>
                          </button>

                          <button
                            onClick={togglePlay}
                            className="p-2 rounded-full bg-white hover:bg-white/90 text-black"
                            aria-label={isPlaying ? "Pause" : "Play"}
                          >
                            {isPlaying ? <Pause className="w-5 h-5 fill-black"/> : <Play className="w-5 h-5 fill-black"/>}
                          </button>

                          <button
                            onClick={() => skip(10)}
                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                            aria-label="Skip forward 10s"
                          >
                            <SkipForward className="w-4 h-4"/>
                          </button>

                          <button
                            onClick={toggleMute}
                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white ml-1"
                            aria-label={muted ? "Unmute" : "Mute"}
                          >
                            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Fullscreen toggle */}
                          <button
                            onClick={toggleFullscreen}
                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                          >
                            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                          </button>

                          {/* Hide/minimize */}
                          {!isFullscreen && (
                            <button
                              onClick={() => setMinimized(true)}
                              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                              aria-label="Minimize player"
                              title="Minimize player"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          )}

                          {/* Close */}
                          <button
                            onClick={handleClose}
                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                            aria-label="Close player"
                            title="Close player"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* YouTube-style Action Buttons - Below video controls */}
                      {(!isFullscreen || showUI) && (
                        <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                          {/* Like button */}
                          <button
                            onClick={toggleFavorite}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                            aria-label={isFavorited ? "Unlike" : "Like"}
                          >
                            <ThumbsUp className={`w-5 h-5 ${isFavorited ? 'fill-white' : ''}`} />
                            <span className="text-sm font-medium hidden sm:inline">{isFavorited ? 'Liked' : 'Like'}</span>
                          </button>

                          {/* Dislike button */}
                          <button
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                            aria-label="Dislike"
                          >
                            <ThumbsDown className="w-5 h-5" />
                            <span className="text-sm font-medium hidden sm:inline">Dislike</span>
                          </button>

                          {/* Comment button */}
                          <button
                            onClick={() => setShowComments(!showComments)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                            aria-label="Comments"
                          >
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-sm font-medium hidden sm:inline">Comment</span>
                          </button>

                          {/* Share button */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                                aria-label="Share"
                              >
                                <Share2 className="w-5 h-5" />
                                <span className="text-sm font-medium hidden sm:inline">Share</span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900/95 border-white/10 backdrop-blur-sm z-[70]">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  copyToClipboard();
                                }}
                                className="text-white hover:bg-white/10 cursor-pointer focus:bg-white/10"
                              >
                                <Link className="w-4 h-4 mr-2" />
                                Copy link
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  shareViaEmail();
                                }}
                                className="text-white hover:bg-white/10 cursor-pointer focus:bg-white/10"
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                Email
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  shareViaTwitter();
                                }}
                                className="text-white hover:bg-white/10 cursor-pointer focus:bg-white/10"
                              >
                                <Twitter className="w-4 h-4 mr-2" />
                                Twitter
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  shareViaFacebook();
                                }}
                                className="text-white hover:bg-white/10 cursor-pointer focus:bg-white/10"
                              >
                                <Facebook className="w-4 h-4 mr-2" />
                                Facebook
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                    
                    {/* Video Comments Section */}
                    <VideoComments 
                      videoId={videoId} 
                      showComments={showComments}
                      onToggleComments={() => setShowComments(!showComments)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
