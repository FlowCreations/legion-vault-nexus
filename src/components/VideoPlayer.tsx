import { Play, Pause, SkipBack, SkipForward, Volume2, X, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if this category should open fullscreen
  const shouldBeFullscreen = category === 'music_videos' || category === 'documentary';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (!isSeeking && video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        setProgress((video.currentTime / video.duration) * 100 || 0);
      }
    };

    const updateDuration = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };

    const handleLoadedMetadata = () => {
      updateDuration();
    };

    const handleDurationChange = () => {
      updateDuration();
    };

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("durationchange", handleDurationChange);

    if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
      setDuration(video.duration);
    }

    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("durationchange", handleDurationChange);
    };
  }, [videoRef, isSeeking]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
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
      <DialogContent className={shouldBeFullscreen ? "max-w-none w-screen h-screen p-0 bg-black border-0 m-0" : "max-w-6xl p-0 bg-black border-border"}>
        <div ref={containerRef} className={shouldBeFullscreen ? "relative bg-black w-full h-full flex flex-col" : "relative bg-black"}>
          {/* Video */}
          <div className={shouldBeFullscreen ? "relative bg-black flex-1 flex items-center justify-center" : "relative bg-black aspect-video"}>
            <video
              ref={videoRef}
              src={videoUrl}
              poster={thumbnailUrl}
              className={shouldBeFullscreen ? "w-full h-full object-contain" : "w-full h-full"}
              onClick={togglePlayPause}
            />
          </div>

          {/* Controls */}
          <div className={shouldBeFullscreen ? "bg-graphite/95 backdrop-blur-sm border-t border-border p-4 z-10 shrink-0" : "bg-graphite/95 backdrop-blur-sm border-t border-border p-4 z-10"}>
            <div className="space-y-3">
              {/* Title */}
              <div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-foreground tabular-nums min-w-[40px]">
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
                <span className="text-xs font-semibold text-foreground tabular-nums min-w-[40px]">
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
