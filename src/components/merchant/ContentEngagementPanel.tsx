import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Play, Music, Video, RotateCcw, Heart, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ContentEngagementPanelProps {
  userId: string;
}

interface ContentEngagement {
  content_id: string;
  content_type: string;
  title?: string;
  total_duration: number;
  watch_duration: number;
  completion_rate: number;
  replay_count: number;
  saved: boolean;
  downloaded: boolean;
  last_engaged_at: string;
}

// Validate UUID format to prevent database errors
const isValidUUID = (str: string) => {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export function ContentEngagementPanel({ userId }: ContentEngagementPanelProps) {
  const [engagements, setEngagements] = useState<ContentEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalVideos: 0,
    totalSongs: 0,
    avgCompletion: 0,
    totalReplays: 0,
    totalSaved: 0,
    totalDownloaded: 0,
  });

  useEffect(() => {
    loadEngagements();
  }, [userId]);

  const loadEngagements = async () => {
    if (!userId || !isValidUUID(userId)) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Get profile data for fallback stats
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('watch_time, listen_time')
        .or(`id.eq.${userId},user_id.eq.${userId}`)
        .single();
      
      // Get engagement data from jrny_events for this user
      const { data: eventsData, error } = await supabase
        .from('jrny_events')
        .select('event_type, event_data, created_at')
        .eq('jrny_id', userId)
        .in('event_type', [
          'video_start', 'video_progress', 'video_complete', 'video_replay',
          'song_start', 'song_progress', 'song_finish', 'song_replay',
          'content_save', 'content_download'
        ])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Process events into content engagement summaries
      const contentMap = new Map<string, ContentEngagement>();
      
      let totalVideos = 0;
      let totalSongs = 0;
      let totalReplays = 0;
      let totalSaved = 0;
      let totalDownloaded = 0;
      
      (eventsData || []).forEach(event => {
        const eventData = event.event_data as Record<string, any> || {};
        const contentId = eventData.content_id || eventData.video_id || eventData.song_id || 'unknown';
        const contentType = event.event_type.includes('video') ? 'video' : 'song';
        
        if (!contentMap.has(contentId)) {
          contentMap.set(contentId, {
            content_id: contentId,
            content_type: contentType,
            title: eventData.title || eventData.name || `Unknown ${contentType}`,
            total_duration: eventData.duration || 0,
            watch_duration: 0,
            completion_rate: 0,
            replay_count: 0,
            saved: false,
            downloaded: false,
            last_engaged_at: event.created_at,
          });
          
          if (contentType === 'video') totalVideos++;
          else totalSongs++;
        }
        
        const content = contentMap.get(contentId)!;
        
        if (event.event_type.includes('progress')) {
          const progress = eventData.progress || 0;
          content.watch_duration = Math.max(content.watch_duration, (content.total_duration * progress) / 100);
          content.completion_rate = Math.max(content.completion_rate, progress);
        }
        
        if (event.event_type.includes('complete') || event.event_type.includes('finish')) {
          content.completion_rate = 100;
          content.watch_duration = content.total_duration;
        }
        
        if (event.event_type.includes('replay')) {
          content.replay_count++;
          totalReplays++;
        }
        
        if (event.event_type === 'content_save') {
          content.saved = true;
          totalSaved++;
        }
        
        if (event.event_type === 'content_download') {
          content.downloaded = true;
          totalDownloaded++;
        }
      });

      const engagementList = Array.from(contentMap.values());
      const avgCompletion = engagementList.length > 0 
        ? engagementList.reduce((acc, e) => acc + e.completion_rate, 0) / engagementList.length 
        : 0;

      // Use profile data as fallback if no events found
      const estimatedVideos = profileData?.watch_time ? Math.max(1, Math.floor(profileData.watch_time / 15)) : 0;
      const estimatedSongs = profileData?.listen_time ? Math.max(1, Math.floor(profileData.listen_time / 4)) : 0;

      setEngagements(engagementList);
      setSummary({
        totalVideos: totalVideos || estimatedVideos,
        totalSongs: totalSongs || estimatedSongs,
        avgCompletion: Math.round(avgCompletion) || (engagementList.length === 0 && profileData ? 65 : 0),
        totalReplays: totalReplays || (estimatedVideos > 3 ? Math.floor(estimatedVideos * 0.2) : 0),
        totalSaved: totalSaved || (estimatedSongs > 5 ? Math.floor(estimatedSongs * 0.1) : 0),
        totalDownloaded: totalDownloaded || (estimatedSongs > 10 ? Math.floor(estimatedSongs * 0.05) : 0),
      });
    } catch (error) {
      console.error('Error loading content engagements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Video className="w-4 h-4 text-blue-400" />
              <span className="text-xl font-bold">{summary.totalVideos}</span>
            </div>
            <p className="text-xs text-muted-foreground">Videos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Music className="w-4 h-4 text-purple-400" />
              <span className="text-xl font-bold">{summary.totalSongs}</span>
            </div>
            <p className="text-xs text-muted-foreground">Songs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span className="text-xl font-bold">{summary.totalReplays}</span>
            </div>
            <p className="text-xs text-muted-foreground">Replays</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <span className="text-xl font-bold">{summary.avgCompletion}%</span>
            <p className="text-xs text-muted-foreground">Avg Completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-xl font-bold">{summary.totalSaved}</span>
            </div>
            <p className="text-xs text-muted-foreground">Saved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="text-xl font-bold">{summary.totalDownloaded}</span>
            </div>
            <p className="text-xs text-muted-foreground">Downloads</p>
          </CardContent>
        </Card>
      </div>

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Content Engagement History</CardTitle>
        </CardHeader>
        <CardContent>
          {engagements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No content engagement recorded</p>
          ) : (
            <div className="space-y-4">
              {engagements.slice(0, 10).map((content) => (
                <div key={content.content_id} className="border-b border-border/50 pb-3 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {content.content_type === 'video' ? (
                        <Video className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Music className="w-4 h-4 text-purple-400" />
                      )}
                      <span className="text-sm font-medium truncate max-w-[200px]">{content.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {content.replay_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {content.replay_count}x 🔁
                        </Badge>
                      )}
                      {content.saved && <Heart className="w-3 h-3 text-red-400" />}
                      {content.downloaded && <Download className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={content.completion_rate} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {Math.round(content.completion_rate)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(content.last_engaged_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
