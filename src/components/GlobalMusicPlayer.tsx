import { useEffect, useRef } from "react";
import { MusicPlayer } from "./MusicPlayer";
import { useMusicPlayer } from "@/stores/musicPlayerStore";
import { toast } from "@/hooks/use-toast";
import { useEventTracking } from "@/hooks/useEventTracking";
import { incrementSongListenCount } from "@/hooks/useSurveyTrigger";
import { useMilestoneProgress } from "@/hooks/useMilestoneProgress";
import { MilestoneModal } from "./MilestoneModal";

export function GlobalMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentTrack, isPlaying, setIsPlaying, playNext, isMinimized } = useMusicPlayer();
  const { trackEvent } = useEventTracking();
  const { newMilestone, clearMilestone } = useMilestoneProgress();
  const listenStartTime = useRef<number>(0);
  const progressMilestones = useRef<Set<number>>(new Set());
  const lastTrackId = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.url) return;

    console.log('Loading track:', currentTrack.title, currentTrack.url);

    // Reset playback position to start
    audio.currentTime = 0;
    
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
      // Reset to start after metadata loads
      audio.currentTime = 0;
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

    const handleTimeUpdate = () => {
      if (!currentTrack || !audio.duration) return;
      
      const currentTime = audio.currentTime;
      const duration = audio.duration;
      const completionPercent = (currentTime / duration) * 100;
      const milestones = [25, 50, 75];
      
      milestones.forEach(milestone => {
        if (completionPercent >= milestone && !progressMilestones.current.has(milestone)) {
          progressMilestones.current.add(milestone);
          trackEvent('music_progress', {
            track_id: currentTrack.id,
            title: currentTrack.title,
            artist: currentTrack.artist,
            album: currentTrack.album,
            duration: Math.floor(duration),
            current_time: Math.floor(currentTime),
            completion_percent: milestone,
            listen_duration: Math.floor((Date.now() - listenStartTime.current) / 1000)
          });
        }
      });
    };

    const handleEnded = () => {
      // Track listen duration when track ends
      if (listenStartTime.current > 0 && currentTrack) {
        const listenDuration = Math.floor((Date.now() - listenStartTime.current) / 1000);
        trackEvent('music_complete', {
          track_id: currentTrack.id,
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album,
          duration: Math.floor(audio.duration || 0),
          listen_duration: listenDuration,
          completion_percent: 100
        });
        listenStartTime.current = 0;
        progressMilestones.current.clear();
        
        // Increment song listen count for survey trigger
        incrementSongListenCount();
      }
      setIsPlaying(false);
      playNext();
    };
    
    const handlePause = () => {
      // Track partial listen on pause
      if (listenStartTime.current > 0 && currentTrack && audio.duration) {
        const listenDuration = Math.floor((Date.now() - listenStartTime.current) / 1000);
        const completionPercent = (audio.currentTime / audio.duration) * 100;
        trackEvent('music_listen', {
          track_id: currentTrack.id,
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album,
          duration: Math.floor(audio.duration),
          listen_duration: listenDuration,
          completion_percent: Math.floor(completionPercent),
          completed: false
        });
        listenStartTime.current = 0;
      }
      setIsPlaying(false);
    };
    
    const handlePlay = () => {
      listenStartTime.current = Date.now();
      setIsPlaying(true);
      
      // Track skip if this is a different track than the last one and it started quickly
      if (currentTrack && lastTrackId.current && lastTrackId.current !== currentTrack.id) {
        trackEvent('music_skip', {
          from_track_id: lastTrackId.current,
          to_track_id: currentTrack.id,
          to_title: currentTrack.title,
          to_artist: currentTrack.artist
        });
      }
      
      if (currentTrack) {
        lastTrackId.current = currentTrack.id;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [currentTrack]);

  return (
    <>
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
      <MusicPlayer audioRef={audioRef} />
      {newMilestone && (
        <MilestoneModal milestone={newMilestone} onClose={clearMilestone} />
      )}
    </>
  );
}
