import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X, ChevronDown, Volume2, VolumeX, SkipBack, SkipForward, Maximize, Heart, Share2, Link, Mail, MessageSquare } from "lucide-react";
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
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { trackEvent } = useEventTracking();
  const watchStartTime = useRef<number>(0);
  const progressMilestones = useRef<Set<number>>(new Set());

  const isPortraitVideo = category === 'behind_the_scenes' || category === 'performances';

  const kickIdleTimer = () => {
    if (idleTimeout.current) clearTimeout(idleTimeout.current);
    if (isPlaying && isExpanded && !showComments) {
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
  }, [isPlaying, isExpanded, showComments]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'INPUT') return;
      if (e.code === 'Space' && isOpen) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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
    if (isOpen) checkFavorite();
  }, [isOpen, videoId]);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      setIsExpanded(false);
      kickIdleTimer();
      watchStartTime.current = Date.now();
      trackEvent('video_view', { video_id: videoId, title, category });
    }
  }, [isOpen]);

  const onTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const videoDuration = videoRef.current.duration || 0;
    setProgress(currentTime);
    setDuration(videoDuration);
    
    // Track progress milestones
    if (videoDuration > 0) {
      const completionPercent = (currentTime / videoDuration) * 100;
      const milestones = [25, 50, 75, 100];
      
      milestones.forEach(milestone => {
        if (completionPercent >= milestone && !progressMilestones.current.has(milestone)) {
          progressMilestones.current.add(milestone);
          trackEvent('video_progress', {
            video_id: videoId,
            title,
            category,
            duration: Math.floor(videoDuration),
            current_time: Math.floor(currentTime),
            completion_percent: milestone,
            watch_duration: Math.floor((Date.now() - watchStartTime.current) / 1000)
          });
        }
      });
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowUI(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVolume = Number(e.target.value);
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setMuted(newVolume === 0);
    if (newVolume > 0 && videoRef.current.muted) {
      videoRef.current.muted = false;
    }
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Number(e.target.value);
    setProgress(Number(e.target.value));
  };

  const skip = (seconds: number) => {
    if (videoRef.current) videoRef.current.currentTime += seconds;
  };

  const fmt = (t: number) => {
    if (!isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleClose = () => {
    if (videoRef.current) {
      const watchDuration = Math.floor((Date.now() - watchStartTime.current) / 1000);
      const completionPercent = duration > 0 ? (progress / duration) * 100 : 0;
      
      trackEvent('video_watch', {
        video_id: videoId,
        title,
        category,
        duration: Math.floor(duration),
        watch_duration: watchDuration,
        completion_percent: Math.floor(completionPercent),
        completed: completionPercent >= 95
      });
      
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
    setIsExpanded(false);
    setShowComments(false);
    progressMilestones.current.clear();
    watchStartTime.current = 0;
    onClose();
  };

  const toggleFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ description: "Please sign in to favorite videos", variant: "destructive" });
      return;
    }
    if (isFavorited) {
      await supabase.from('video_favorites').delete().eq('user_id', user.id).eq('video_id', videoId);
      setIsFavorited(false);
      toast({ description: "Removed from favorites" });
    } else {
      await supabase.from('video_favorites').insert({ user_id: user.id, video_id: videoId });
      setIsFavorited(true);
      toast({ description: "Added to favorites" });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/videos?v=${videoId}`);
      toast({ description: "Link copied to clipboard" });
    } catch {
      toast({ description: "Failed to copy link", variant: "destructive" });
    }
  };

  const shareViaText = () => {
    const text = `Check out this video: ${title}\n${window.location.origin}/videos?v=${videoId}`;
    const smsUrl = `sms:?&body=${encodeURIComponent(text)}`;
    window.location.href = smsUrl;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      drag={!isExpanded}
      dragMomentum={false}
      dragElastic={0.05}
      dragConstraints={isPortraitVideo 
        ? { left: -window.innerWidth/2 + 196, right: window.innerWidth/2 - 196, top: -window.innerHeight/2 + 350, bottom: window.innerHeight/2 - 350 }
        : { left: -window.innerWidth/2 + 350, right: window.innerWidth/2 - 350, top: -window.innerHeight/2 + 196, bottom: window.innerHeight/2 - 196 }}
      initial={false}
      animate={isExpanded 
        ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: 0, x: 0, y: 0 } 
        : isPortraitVideo
        ? { position: 'fixed', width: 393, height: 700, borderRadius: 12 }
        : { position: 'fixed', width: 700, height: 393, borderRadius: 12 }}
      transition={isExpanded ? { type: "spring", stiffness: 300, damping: 30 } : { type: "tween", duration: 0 }}
      ref={containerRef}
      className={isExpanded ? "z-[9999] bg-black" : "z-[9999] bg-black rounded-xl shadow-2xl border border-white/20"}
      style={!isExpanded ? { left: '50%', top: '50%', x: '-50%', y: '-50%' } : undefined}
      onMouseMove={kickIdleTimer}
    >
      <div className={isExpanded ? "relative w-full h-full flex items-center justify-center" : "relative w-full h-full"}>
        <video 
          ref={videoRef} 
          src={videoUrl} 
          poster={thumbnailUrl} 
          playsInline 
          onTimeUpdate={onTimeUpdate} 
          onClick={togglePlay}
          onEnded={() => {
            setIsPlaying(false);
            const watchDuration = Math.floor((Date.now() - watchStartTime.current) / 1000);
            trackEvent('video_complete', {
              video_id: videoId,
              title,
              category,
              duration: Math.floor(duration),
              watch_duration: watchDuration,
              completion_percent: 100
            });
            kickIdleTimer();
          }}
          className={isExpanded ? (isPortraitVideo ? "h-full object-contain" : "w-full h-full object-contain") : "w-full h-full object-cover cursor-pointer"} 
        />
        
        <AnimatePresence>
          {(showUI || !isPlaying) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between pointer-events-auto">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm md:text-lg">{title}</h3>
                  {description && isExpanded && <p className="text-white/80 text-xs md:text-sm mt-1 line-clamp-2">{description}</p>}
                </div>
                <div className="flex gap-2 ml-4">
                  {isExpanded && <button onClick={toggleExpand} className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors" title="Minimize"><ChevronDown className="w-5 h-5" /></button>}
                  <button onClick={handleClose} className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors" title="Close"><X className="w-5 h-5" /></button>
                </div>
              </div>
              {!isPlaying && <button onClick={togglePlay} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-4 rounded-full bg-primary/80 hover:bg-primary text-white transition-all hover:scale-110 pointer-events-auto"><Play className="w-8 h-8 md:w-12 md:h-12" /></button>}
              <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
                <div className="mb-3">
                  <input type="range" min="0" max={duration || 100} value={progress} onChange={onSeek} className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer" />
                  <div className="flex justify-between text-xs text-white/80 mt-1"><span>{fmt(progress)}</span><span>{fmt(duration)}</span></div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => skip(-10)} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"><SkipBack className="w-5 h-5" /></button>
                    <button onClick={togglePlay} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">{isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}</button>
                    <button onClick={() => skip(10)} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"><SkipForward className="w-5 h-5" /></button>
                    <div 
                      className="flex items-center gap-2"
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleMute(); }} 
                        className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                      >
                        {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ 
                          width: showVolumeSlider ? 80 : 0,
                          opacity: showVolumeSlider ? 1 : 0
                        }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.01" 
                          value={muted ? 0 : volume} 
                          onChange={handleVolumeChange}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                        />
                      </motion.div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isExpanded && <button onClick={toggleExpand} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors" title="Expand"><Maximize className="w-5 h-5" /></button>}
                    {isExpanded && (
                      <>
                        <button onClick={toggleFavorite} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"><Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} /></button>
                        <button onClick={() => setShowComments(!showComments)} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"><MessageSquare className="w-5 h-5" /></button>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                              <Share2 className="w-5 h-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="bg-background border-border z-[99999]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(); }} 
                              className="cursor-pointer"
                            >
                              <Link className="w-4 h-4 mr-2" />Copy link
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); shareViaText(); }} 
                              className="cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />Share via text
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {isExpanded && <VideoComments videoId={videoId} showComments={showComments} onToggleComments={() => setShowComments(!showComments)} />}
    </motion.div>
  );
}