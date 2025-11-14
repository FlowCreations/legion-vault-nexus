import { Play, Pause, SkipBack, SkipForward, Download, Heart, Volume2, MoreVertical, ChevronDown, X, Share2, Link, Facebook, Twitter, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useMusicPlayer } from "@/stores/musicPlayerStore";
import { LyricsDialog } from "./LyricsDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MusicPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
}

export function MusicPlayer({ audioRef }: MusicPlayerProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, togglePlayPause, playNext, playPrevious, setMinimized, isMinimized, reset, toggleLike, isLiked } = useMusicPlayer();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showLyricsDialog, setShowLyricsDialog] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (!isSeeking && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100 || 0);
      }
    };

    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      updateDuration();
    };

    const handleDurationChange = () => {
      updateDuration();
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleDurationChange);

    // Force update duration if already loaded
    if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleDurationChange);
    };
  }, [audioRef, isSeeking]);

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
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopyLink = () => {
    const url = window.location.origin + `/music?track=${currentTrack?.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Track link copied to clipboard",
    });
  };

  const trackLiked = currentTrack ? isLiked(currentTrack.id) : false;

  if (!currentTrack) return null;

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-4 left-4 bg-graphite border border-border rounded-lg shadow-lg z-40 hover:shadow-glow transition-all"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground z-10"
          onClick={(e) => {
            e.stopPropagation();
            reset();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
        <div 
          className="flex items-center gap-3 px-4 py-3 cursor-pointer"
          onClick={() => setMinimized(false)}
        >
          <div className="w-10 h-10 rounded overflow-hidden bg-card flex-shrink-0">
            {currentTrack.image ? (
              <img 
                src={currentTrack.image} 
                alt={currentTrack.album}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
                {currentTrack.title[0]}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate max-w-[200px]">{currentTrack.title}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {currentTrack.artist}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 rounded-full bg-white hover:bg-white/90 text-black"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-black" />
              ) : (
                <Play className="h-4 w-4 fill-black ml-0.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                playNext();
              }}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-graphite border-t border-border backdrop-blur-lg bg-opacity-95 z-40 animate-slide-in-bottom">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-4">
          {/* Minimize Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => setMinimized(true)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

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
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{currentTrack.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentTrack.artist}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem 
                      onClick={() => navigate('/song-credits', { state: { track: currentTrack } })}
                    >
                      Credits
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowLyricsDialog(true)}>
                      <Music className="mr-2 h-4 w-4" />
                      Lyrics
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
                onClick={() => currentTrack && toggleLike(currentTrack.id)}
              >
                <Heart className={`h-4 w-4 ${trackLiked ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Link className="h-4 w-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const url = encodeURIComponent(window.location.origin + `/music?track=${currentTrack?.id}`);
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                  }}>
                    <Facebook className="h-4 w-4 mr-2" />
                    Share on Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const url = encodeURIComponent(window.location.origin + `/music?track=${currentTrack?.id}`);
                    const text = encodeURIComponent(`Check out ${currentTrack?.title} by ${currentTrack?.artist}`);
                    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
                  }}>
                    <Twitter className="h-4 w-4 mr-2" />
                    Share on Twitter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={playPrevious}
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
                onClick={playNext}
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
              
              {/* Volume Control with bars */}
              <div className="flex items-center gap-2 ml-4">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-0.5 h-4">
                  {[...Array(10)].map((_, i) => {
                    const barHeight = 8 + (i * 1.6); // Heights from 8px to 22.4px
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
            </div>
          </div>

          {/* Empty spacer for layout balance */}
          <div className="flex-1"></div>
        </div>
      </div>
      
      <LyricsDialog
        isOpen={showLyricsDialog}
        onClose={() => setShowLyricsDialog(false)}
        trackId={currentTrack?.id || ''}
        trackTitle={currentTrack?.title || ''}
        artist={currentTrack?.artist || ''}
      />
    </div>
  );
}
