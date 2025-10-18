import { Play, Pause, SkipBack, SkipForward, Flame, Download, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  time: string;
  url?: string;
  image?: string;
}

interface MusicPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  allTracks: Track[];
}

export function MusicPlayer({
  currentTrack,
  isPlaying,
  audioRef,
  onPlayPause,
  onNext,
  onPrevious,
}: MusicPlayerProps) {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (!isSeeking) {
        setProgress((audio.currentTime / audio.duration) * 100 || 0);
      }
    };

    const updateDuration = () => {
      setDuration(audio.duration || 0);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", updateDuration);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [audioRef]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume, audioRef]);

  const handleSeek = (value: number[]) => {
    setProgress(value[0]);
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = (value: number[]) => {
    if (audioRef.current && duration && !isNaN(duration) && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      if (isFinite(newTime) && newTime >= 0) {
        audioRef.current.currentTime = newTime;
      }
    }
    setIsSeeking(false);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-graphite border-t border-border backdrop-blur-lg bg-opacity-95 z-50 animate-slide-in-bottom">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <div className="w-14 h-14 bg-card rounded overflow-hidden flex-shrink-0">
              {currentTrack.image ? (
                <img 
                  src={currentTrack.image} 
                  alt={currentTrack.album}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {currentTrack.title[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.artist}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {currentTrack.url && (
                <a 
                  href={currentTrack.url} 
                  download={`${currentTrack.title} - ${currentTrack.artist}.mp3`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onPrevious}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                className="h-10 w-10 rounded-full bg-white hover:bg-white/90 text-black"
                onClick={onPlayPause}
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
                onClick={onNext}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="w-full flex items-center gap-2">
              <span className="text-xs text-muted-foreground tabular-nums min-w-[35px]">
                {formatTime((progress / 100) * duration)}
              </span>
              <Slider
                value={[progress]}
                onValueChange={handleSeek}
                onValueCommit={handleSeekEnd}
                onPointerDown={handleSeekStart}
                max={100}
                step={0.1}
                className="flex-1"
                disabled={!duration || isNaN(duration) || duration === 0}
              />
              <span className="text-xs text-muted-foreground tabular-nums min-w-[35px]">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume - vertical slider */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-2 h-24">
              <Slider
                value={[volume]}
                onValueChange={(v) => setVolume(v[0])}
                max={100}
                step={1}
                orientation="vertical"
                className="h-full hidden sm:flex"
              />
              <Flame 
                className="h-4 w-4 transition-all duration-300" 
                style={{ 
                  color: volume > 0 ? `hsl(${20 + (volume * 0.8)}, 90%, ${50 + (volume * 0.2)}%)` : 'hsl(var(--muted-foreground))',
                  filter: volume > 70 ? 'drop-shadow(0 0 4px hsla(25, 95%, 60%, 0.6))' : 'none'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
