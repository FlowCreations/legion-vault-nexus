import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Clock, Play } from 'lucide-react';
import { StreamHighlights } from './StreamHighlights';
import { toast } from 'sonner';

interface VOD {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_seconds: number;
  view_count: number;
  stream_started_at: string;
}

interface Highlight {
  id: string;
  start_time_seconds: number;
  end_time_seconds: number;
}

interface VODPlayerProps {
  vodId: string;
  onClose?: () => void;
}

export function VODPlayer({ vodId, onClose }: VODPlayerProps) {
  const [vod, setVod] = useState<VOD | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionId = useRef(crypto.randomUUID());

  useEffect(() => {
    loadVOD();
    trackView();
  }, [vodId]);

  useEffect(() => {
    // Track watch progress
    const interval = setInterval(() => {
      if (videoRef.current && isPlaying) {
        const watchTime = Math.floor(videoRef.current.currentTime);
        setCurrentTime(watchTime);
        updateWatchProgress(watchTime);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isPlaying]);

  const loadVOD = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('livestream_vods')
        .select('*')
        .eq('id', vodId)
        .single();

      if (error) throw error;
      setVod((data as unknown) as VOD);
    } catch (error) {
      console.error('Error loading VOD:', error);
      toast.error('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    await (supabase as any).from('vod_views').insert({
      vod_id: vodId,
      user_id: user?.id,
      session_id: sessionId.current
    });

    // Increment view count
    const { data: currentVod } = await (supabase as any)
      .from('livestream_vods')
      .select('view_count')
      .eq('id', vodId)
      .single();

    if (currentVod) {
      await (supabase as any)
        .from('livestream_vods')
        .update({ view_count: ((currentVod as any).view_count || 0) + 1 })
        .eq('id', vodId);
    }
  };

  const updateWatchProgress = async (duration: number) => {
    const { data: { user } } = await supabase.auth.getUser();

    await (supabase as any)
      .from('vod_views')
      .update({ 
        watch_duration_seconds: duration,
        completed: vod ? duration >= vod.duration_seconds * 0.9 : false
      })
      .eq('vod_id', vodId)
      .eq('session_id', sessionId.current);
  };

  const handlePlayHighlight = (startTime: number, endTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
      setIsPlaying(true);

      // Optional: Stop at end time
      const checkEnd = setInterval(() => {
        if (videoRef.current && videoRef.current.currentTime >= endTime) {
          videoRef.current.pause();
          clearInterval(checkEnd);
        }
      }, 100);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center">Loading video...</div>
      </Card>
    );
  }

  if (!vod) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">Video not found</div>
      </Card>
    );
  }

  return (
    <div className="flex h-full gap-4">
      {/* Video Player */}
      <div className="flex-1 space-y-4">
        <Card className="overflow-hidden">
          <div className="aspect-video bg-black relative">
            {vod.video_url ? (
              <video
                ref={videoRef}
                src={vod.video_url}
                controls
                className="w-full h-full"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Video processing in progress...</p>
                  <p className="text-sm text-white/60 mt-2">Check back soon</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Video Info */}
        <Card className="p-4">
          <h2 className="text-xl font-bold mb-2">{vod.title}</h2>
          {vod.description && (
            <p className="text-muted-foreground mb-4">{vod.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {vod.view_count} views
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDuration(vod.duration_seconds)}
            </div>
            <Badge variant="secondary">
              {new Date(vod.stream_started_at).toLocaleDateString()}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Highlights Sidebar */}
      <div className="w-80">
        <StreamHighlights 
          eventId={vod.event_id} 
          onPlayHighlight={handlePlayHighlight}
        />
      </div>
    </div>
  );
}
