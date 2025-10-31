import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X, ChevronDown, Volume2, VolumeX, SkipBack, SkipForward, Maximize, Minimize } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if this category should open fullscreen
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

  // Auto-play when opened
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      setMinimized(false);
      kickIdleTimer();
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
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
    setMinimized(false);
    onClose();
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
            <div className="relative flex-1 flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                src={videoUrl}
                poster={thumbnailUrl}
                playsInline
                className={isFullscreen 
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
                          <button
                            onClick={() => setMinimized(true)}
                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                            aria-label="Minimize player"
                            title="Minimize player"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

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
                    </div>
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
