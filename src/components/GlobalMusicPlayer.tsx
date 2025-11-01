import { useEffect, useRef } from "react";
import { MusicPlayer } from "./MusicPlayer";
import { useMusicPlayer } from "@/stores/musicPlayerStore";
import { toast } from "@/hooks/use-toast";
import { useEventTracking } from "@/hooks/useEventTracking";
import { incrementSongListenCount } from "@/hooks/useSurveyTrigger";

export function GlobalMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentTrack, isPlaying, setIsPlaying, playNext, isMinimized } = useMusicPlayer();
  const { trackEvent } = useEventTracking();
  const listenStartTime = useRef<number>(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.url) return;

    console.log('Loading track:', currentTrack.title, currentTrack.url);

    // Set new source
    audio.src = currentTrack.url;
    
    const handleError = (e: any) => {
      console.error("Audio error:", {
        error: e,
        code: audio.error?.code,
        message: audio.error?.message,
        url: currentTrack.url,
        networkState: audio.networkState,
        readyState: audio.readyState
      });
      setIsPlaying(false);
      toast({
        title: "Unable to play track",
        description: `"${currentTrack.title}" could not be loaded.`,
        variant: "destructive",
      });
    };

    const handleLoadedMetadata = () => {
      console.log('Metadata loaded, duration:', audio.duration);
    };

    const handleCanPlay = () => {
      console.log('Audio can play, attempting playback');
      audio.play()
        .then(() => {
          console.log('Playback started successfully');
          setIsPlaying(true);
          
          // Track music start
          listenStartTime.current = Date.now();
          trackEvent('music_play', {
            track_id: currentTrack?.id,
            title: currentTrack?.title,
            artist: currentTrack?.artist
          });
        })
        .catch(err => {
          console.error('Play error:', err);
          setIsPlaying(false);
        });
    };
    
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay, { once: true });
    
    audio.load();

    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentTrack?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      // Track listen duration when track ends
      if (listenStartTime.current > 0 && currentTrack) {
        const listenDuration = Math.floor((Date.now() - listenStartTime.current) / 1000);
        trackEvent('music_listen', {
          track_id: currentTrack.id,
          title: currentTrack.title,
          duration: listenDuration,
          completed: true
        });
        listenStartTime.current = 0;
        
        // Increment song listen count for survey trigger
        incrementSongListenCount();
      }
      setIsPlaying(false);
      playNext();
    };
    
    const handlePause = () => {
      // Track partial listen on pause
      if (listenStartTime.current > 0 && currentTrack) {
        const listenDuration = Math.floor((Date.now() - listenStartTime.current) / 1000);
        trackEvent('music_listen', {
          track_id: currentTrack.id,
          title: currentTrack.title,
          duration: listenDuration,
          completed: false
        });
        listenStartTime.current = 0;
      }
      setIsPlaying(false);
    };
    
    const handlePlay = () => {
      listenStartTime.current = Date.now();
      setIsPlaying(true);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
      <MusicPlayer audioRef={audioRef} />
    </>
  );
}
