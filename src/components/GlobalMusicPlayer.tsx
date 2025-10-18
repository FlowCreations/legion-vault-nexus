import { useEffect, useRef } from "react";
import { MusicPlayer } from "./MusicPlayer";
import { useMusicPlayer } from "@/stores/musicPlayerStore";

export function GlobalMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentTrack, isPlaying, setIsPlaying, playNext, isMinimized } = useMusicPlayer();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.url) return;

    // Clear any existing source
    audio.pause();
    audio.src = '';
    audio.load();

    // Small delay to ensure cleanup
    setTimeout(() => {
      audio.src = currentTrack.url!;
      
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
      };
      
      audio.onerror = handleError;
      audio.load();
      
      const handleCanPlay = () => {
        console.log('Audio can play, attempting playback');
        audio.play()
          .then(() => {
            console.log('Playback started successfully');
            setIsPlaying(true);
          })
          .catch(err => {
            console.error('Play error:', err);
            setIsPlaying(false);
          });
      };
      
      audio.addEventListener('canplay', handleCanPlay, { once: true });
    }, 100);
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
      setIsPlaying(false);
      playNext();
    };
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, []);

  if (!currentTrack || isMinimized) return null;

  return (
    <>
      <audio ref={audioRef} preload="auto" />
      <MusicPlayer audioRef={audioRef} />
    </>
  );
}
