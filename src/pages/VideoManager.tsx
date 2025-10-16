import { useEffect, useState } from "react";
import { VideoUpload } from "@/components/VideoUpload";
import { Button } from "@/components/ui/button";
import { Trash2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Video {
  id: string;
  title: string;
  subtitle: string | null;
  category: string;
  storage_path: string;
  thumbnail_url: string | null;
  is_premium: boolean;
  view_count: number;
  created_at: string;
}

export default function VideoManager() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast({
        title: "Failed to load videos",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleDelete = async (video: Video) => {
    if (!confirm(`Delete "${video.title}"?`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('videos')
        .remove([video.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('videos')
        .delete()
        .eq('id', video.id);

      if (dbError) throw dbError;

      toast({
        title: "Video deleted",
        description: "Video has been removed successfully",
      });

      loadVideos();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Failed to delete video",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      music_videos: "Music Videos",
      performances: "Performances",
      behind_the_scenes: "Behind The Scenes",
      documentary: "Documentary"
    };
    return labels[category] || category;
  };

  const getVideoUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('videos')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Video Manager</h1>
          <p className="text-muted-foreground">
            Upload and manage your video content
          </p>
        </div>

        <VideoUpload onUploadComplete={loadVideos} />

        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Your Videos ({videos.length})
          </h2>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading videos...
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No videos uploaded yet. Upload your first video above!
            </div>
          ) : (
            <div className="grid gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="flex gap-4 p-4 border border-border rounded-lg bg-card hover:bg-card-hover transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="relative w-48 aspect-video bg-muted rounded-lg overflow-hidden flex-shrink-0 group">
                    <video
                      src={getVideoUrl(video.storage_path)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {video.title}
                    </h3>
                    {video.subtitle && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {video.subtitle}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="secondary">
                        {getCategoryLabel(video.category)}
                      </Badge>
                      {video.is_premium && (
                        <Badge variant="default">Premium</Badge>
                      )}
                      <Badge variant="outline">
                        {video.view_count} views
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {new Date(video.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(video)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
