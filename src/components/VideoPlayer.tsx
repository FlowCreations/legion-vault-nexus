import { Play, Pause, SkipBack, SkipForward, Volume2, X, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Check if this category should open fullscreen
  const shouldBeFullscreen = category === 'music_videos' || category === 'documentary';

  // Handle mouse movement to show/hide controls in fullscreen
  const handleMouseMove = () => {
    if (shouldBeFullscreen) {
      setShowControls(true);
      
      // Clear existing timeout
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      // Hide controls after 3 seconds of no movement
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    }
  };

  // Reset state when video changes
  useEffect(() => {
    setProgress(0);
    setDuration(0);
    setIsPlaying(false);
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isOpen) return;

    const updateProgress = () => {
      if (!isSeeking && video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        const currentProgress = (video.currentTime / video.duration) * 100;
        setProgress(currentProgress || 0);
      }
    };

    const updateDuration = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        console.log('✅ Duration updated:', video.duration);
        setDuration(video.duration);
        return true;
      }
      return false;
    };

    const handleLoadedMetadata = () => {
      console.log('📹 Metadata loaded, readyState:', video.readyState, 'duration:', video.duration);
      updateDuration();
    };

    const handleDurationChange = () => {
      console.log('⏱️ Duration changed:', video.duration);
      updateDuration();
    };

    const handleCanPlay = () => {
      console.log('▶️ Video can play, duration:', video.duration);
      updateDuration();
    };

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("canplay", handleCanPlay);

    // Try to get duration immediately if available
    if (video.readyState >= 1) {
      console.log('🚀 Video ready immediately, readyState:', video.readyState, 'duration:', video.duration);
      if (!updateDuration()) {
        // Fallback: poll for duration if not available yet
        let attempts = 0;
        const pollDuration = setInterval(() => {
          attempts++;
          console.log(`🔄 Polling for duration (attempt ${attempts})...`);
          if (updateDuration() || attempts >= 10) {
            clearInterval(pollDuration);
            if (attempts >= 10 && !video.duration) {
              console.error('❌ Failed to get video duration after 10 attempts');
            }
          }
        }, 500);

        return () => {
          clearInterval(pollDuration);
          video.removeEventListener("timeupdate", updateProgress);
          video.removeEventListener("loadedmetadata", handleLoadedMetadata);
          video.removeEventListener("durationchange", handleDurationChange);
          video.removeEventListener("canplay", handleCanPlay);
        };
      }
    }

    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [isSeeking, videoUrl, isOpen]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      setShowControls(true);
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    setProgress(value[0]);
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = (value: number[]) => {
    if (videoRef.current && duration && !isNaN(duration) && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      if (isFinite(newTime) && newTime >= 0) {
        videoRef.current.currentTime = newTime;
      }
    }
    setIsSeeking(false);
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={shouldBeFullscreen 
          ? "max-w-none w-screen h-screen p-0 bg-black border-0 !m-0 !inset-0 !translate-x-0 !translate-y-0 !left-0 !top-0" 
          : "max-w-7xl p-0 bg-black border-border"
        }
        onPointerMove={handleMouseMove}
      >
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </VisuallyHidden>
        <div ref={containerRef} className={shouldBeFullscreen ? "relative bg-black w-full h-full flex flex-col" : "relative bg-black"}>
          {/* Close Button - Always visible at top */}
          <div className={`absolute top-4 right-4 z-50 ${shouldBeFullscreen && !showControls ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm"
            >
              <X className="h-5 w-5 text-white" />
            </Button>
          </div>

          {/* Video */}
          <div className={shouldBeFullscreen ? "relative bg-black flex-1 flex items-center justify-center" : "relative bg-black aspect-video"}>
            <video
              ref={videoRef}
              src={videoUrl}
              poster={thumbnailUrl}
              className={shouldBeFullscreen ? "w-full h-full object-contain" : "w-full h-full"}
              onClick={togglePlayPause}
              preload="metadata"
            />
          </div>

          {/* Controls */}
          <div className={`
            ${shouldBeFullscreen ? "bg-graphite/95 backdrop-blur-sm border-t border-border p-4 z-10 shrink-0" : "bg-graphite/95 backdrop-blur-sm border-t border-border p-4 z-10"}
            ${shouldBeFullscreen && !showControls ? "opacity-0 pointer-events-none" : "opacity-100"}
            transition-opacity duration-300
          `}>
            <div className="space-y-3">
              {/* Title */}
              <div>
                <h3 className="font-semibold text-lg text-white">{title}</h3>
                <p className="text-sm text-white/70">{description}</p>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-white tabular-nums min-w-[40px]">
                  {formatTime((progress / 100) * duration)}
                </span>
                <Slider
                  value={[progress]}
                  onValueChange={handleSeek}
                  onValueCommit={handleSeekEnd}
                  onPointerDown={handleSeekStart}
                  max={100}
                  step={0.1}
                  className="flex-1 cursor-pointer"
                  disabled={!duration || isNaN(duration) || duration === 0}
                />
                <span className="text-xs font-semibold text-white tabular-nums min-w-[40px]">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => skip(-10)}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-white hover:bg-white/90 text-black"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 fill-black" />
                    ) : (
                      <Play className="h-5 w-5 fill-black ml-0.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => skip(10)}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  {/* Volume Control */}
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-0.5 h-4">
                      {[...Array(10)].map((_, i) => {
                        const barHeight = 8 + (i * 1.6);
                        const isActive = (i + 1) * 10 <= volume;
                        return (
                          <button
                            key={i}
                            onClick={() => setVolume((i + 1) * 10)}
                            className="w-0.5 transition-all duration-150 hover:opacity-80"
                            style={{
                              height: `${barHeight}px`,
                              backgroundColor: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                              opacity: isActive ? 1 : 0.3
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Fullscreen Toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4 w-4" />
                    ) : (
                      <Maximize className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
