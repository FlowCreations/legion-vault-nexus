import { useEffect, useState } from "react";
import { VideoUpload } from "@/components/VideoUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Play, Edit2, Save, X, Search, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { SimpleThumbnailUploader } from "@/components/SimpleThumbnailUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import "@/utils/uploadThumbnails";

interface Video {
  id: string;
  title: string;
  description: string | null;
  category: string;
  storage_path: string;
  thumbnail_url: string | null;
  is_premium: boolean;
  view_count: number;
  metatags?: string[];
  created_at: string;
}

export default function VideoManager() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMetatags, setEditMetatags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
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

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description || "");
    setEditMetatags(video.metatags || []);
    setNewTag("");
  };

  const handleSaveEdit = async () => {
    if (!editingVideo) return;

    try {
      const { error } = await supabase
        .from('videos')
        .update({
          title: editTitle,
          description: editDescription || null,
          metatags: editMetatags
        })
        .eq('id', editingVideo.id);

      if (error) throw error;

      toast({
        title: "Video updated",
        description: "Video details have been saved successfully",
      });

      setEditingVideo(null);
      loadVideos();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Failed to update video",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const addMetatag = () => {
    if (newTag.trim() && editMetatags.length < 10 && !editMetatags.includes(newTag.trim())) {
      setEditMetatags([...editMetatags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeMetatag = (tag: string) => {
    setEditMetatags(editMetatags.filter(t => t !== tag));
  };

  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.metatags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos by title, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredVideos.length} of {videos.length} videos
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Your Videos ({filteredVideos.length})
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
              {filteredVideos.map((video) => (
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
                    {video.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {video.description}
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
                    {video.metatags && video.metatags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {video.metatags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Uploaded {new Date(video.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(video)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <SimpleThumbnailUploader
                      videoId={video.id}
                      videoTitle={video.title}
                    />
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

        {/* Edit Dialog */}
        <Dialog open={!!editingVideo} onOpenChange={() => setEditingVideo(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Video Details</DialogTitle>
              <DialogDescription>
                Update the title, description, and metatags for this video
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Video title"
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Input
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Video description"
                />
              </div>

              <div>
                <Label>Metatags ({editMetatags.length}/10)</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addMetatag();
                      }
                    }}
                    placeholder="Add a tag..."
                    disabled={editMetatags.length >= 10}
                  />
                  <Button 
                    onClick={addMetatag}
                    disabled={!newTag.trim() || editMetatags.length >= 10}
                    variant="outline"
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editMetatags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-destructive" 
                        onClick={() => removeMetatag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setEditingVideo(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
