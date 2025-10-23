import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2, Image as ImageIcon, Edit, Music, Video } from "lucide-react";

interface AffiliateContent {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  content_type: string | null;
  content_url: string | null;
}

interface AffiliateContentManagerProps {
  affiliateId: string;
  affiliateName: string;
  content: AffiliateContent[];
  onContentUpdate: () => void;
}

export function AffiliateContentManager({ 
  affiliateId, 
  affiliateName, 
  content, 
  onContentUpdate 
}: AffiliateContentManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    content_url: "",
    content_type: "video",
    artist_name: affiliateName,
    album_name: "",
    duration: "",
    release_date: ""
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [editingContent, setEditingContent] = useState<{
    id: string;
    title: string;
    description: string;
    content_url: string;
  } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleThumbnailUpload = async (contentId: string, file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const fileName = `${affiliateId}/${contentId}_${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('affiliate_content')
        .update({ thumbnail_url: publicUrl })
        .eq('id', contentId);

      if (updateError) throw updateError;

      toast.success("Thumbnail updated");
      onContentUpdate();
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast.error("Failed to upload thumbnail");
    }
  };

  const handleAddContent = async () => {
    if (!newContent.title || !newContent.content_url) {
      toast.error("Title and URL are required");
      return;
    }

    setUploading(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_content')
        .insert([{
          affiliate_id: affiliateId,
          title: newContent.title,
          description: newContent.description,
          content_url: newContent.content_url,
          content_type: newContent.content_type,
          thumbnail_url: null
        }])
        .select()
        .single();

      if (error) throw error;

      // Upload thumbnail if provided
      if (thumbnailFile && data) {
        await handleThumbnailUpload(data.id, thumbnailFile);
      }

      toast.success("Content added");
      setNewContent({ 
        title: "", 
        description: "", 
        content_url: "", 
        content_type: "video",
        artist_name: affiliateName,
        album_name: "",
        duration: "",
        release_date: ""
      });
      setThumbnailFile(null);
      onContentUpdate();
    } catch (error) {
      console.error('Error adding content:', error);
      toast.error("Failed to add content");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateContent = async (contentId: string, updates: Partial<AffiliateContent>) => {
    try {
      const { error } = await supabase
        .from('affiliate_content')
        .update(updates)
        .eq('id', contentId);

      if (error) throw error;

      toast.success("Content updated");
      setEditDialogOpen(false);
      setEditingContent(null);
      onContentUpdate();
    } catch (error) {
      console.error('Error updating content:', error);
      toast.error("Failed to update content");
    }
  };

  const handleSaveEdit = () => {
    if (!editingContent) return;
    handleUpdateContent(editingContent.id, {
      title: editingContent.title,
      description: editingContent.description,
      content_url: editingContent.content_url,
    });
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return;

    try {
      const { error } = await supabase
        .from('affiliate_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      toast.success("Content deleted");
      onContentUpdate();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error("Failed to delete content");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Content for {affiliateName}</CardTitle>
          <CardDescription>Add music tracks or videos with custom thumbnails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Content Type</Label>
            <Select 
              value={newContent.content_type} 
              onValueChange={(value) => setNewContent({ ...newContent, content_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Video
                  </div>
                </SelectItem>
                <SelectItem value="music">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Music
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">{newContent.content_type === 'music' ? 'Track Title' : 'Video Title'}</Label>
            <Input
              id="title"
              value={newContent.title}
              onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
              placeholder={newContent.content_type === 'music' ? "e.g., Tennessee Whiskey" : "e.g., Music Video"}
            />
          </div>

          {newContent.content_type === 'music' && (
            <>
              <div>
                <Label htmlFor="artist_name">Artist Name</Label>
                <Input
                  id="artist_name"
                  value={newContent.artist_name}
                  onChange={(e) => setNewContent({ ...newContent, artist_name: e.target.value })}
                  placeholder={affiliateName}
                />
              </div>

              <div>
                <Label htmlFor="album_name">Album/EP Name (Optional)</Label>
                <Input
                  id="album_name"
                  value={newContent.album_name}
                  onChange={(e) => setNewContent({ ...newContent, album_name: e.target.value })}
                  placeholder="e.g., Traveller"
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (MM:SS)</Label>
                <Input
                  id="duration"
                  value={newContent.duration}
                  onChange={(e) => setNewContent({ ...newContent, duration: e.target.value })}
                  placeholder="4:51"
                />
              </div>

              <div>
                <Label htmlFor="release_date">Release Date (Optional)</Label>
                <Input
                  id="release_date"
                  type="date"
                  value={newContent.release_date}
                  onChange={(e) => setNewContent({ ...newContent, release_date: e.target.value })}
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={newContent.description}
              onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
              placeholder="Brief description"
            />
          </div>

          <div>
            <Label htmlFor="content_url">{newContent.content_type === 'music' ? 'Spotify/Music URL' : 'Video URL'}</Label>
            <Input
              id="content_url"
              type="url"
              value={newContent.content_url}
              onChange={(e) => setNewContent({ ...newContent, content_url: e.target.value })}
              placeholder={newContent.content_type === 'music' ? "https://open.spotify.com/..." : "https://youtube.com/..."}
            />
          </div>

          <div>
            <Label htmlFor="thumbnail">{newContent.content_type === 'music' ? 'Album Art' : 'Thumbnail Image'}</Label>
            <Input
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button onClick={handleAddContent} disabled={uploading}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Adding..." : "Add Content"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Content</CardTitle>
          <CardDescription>Manage thumbnails and content for {affiliateName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {content.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-24 h-24 flex-shrink-0">
                  {item.thumbnail_url ? (
                    <img 
                      src={item.thumbnail_url} 
                      alt={item.title}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold">{item.title}</h4>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                  {item.content_url && (
                    <a 
                      href={item.content_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      View Content
                    </a>
                  )}
                </div>

                <div className="flex gap-2">
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingContent({
                            id: item.id,
                            title: item.title,
                            description: item.description || '',
                            content_url: item.content_url || '',
                          });
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Content</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={editingContent?.title || ''}
                            onChange={(e) => setEditingContent(prev => prev ? { ...prev, title: e.target.value } : null)}
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={editingContent?.description || ''}
                            onChange={(e) => setEditingContent(prev => prev ? { ...prev, description: e.target.value } : null)}
                          />
                        </div>
                        <div>
                          <Label>Video URL</Label>
                          <Input
                            value={editingContent?.content_url || ''}
                            onChange={(e) => setEditingContent(prev => prev ? { ...prev, content_url: e.target.value } : null)}
                          />
                        </div>
                        <Button onClick={handleSaveEdit} className="w-full">
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Label htmlFor={`thumb-${item.id}`} className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Thumbnail
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id={`thumb-${item.id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleThumbnailUpload(item.id, file);
                    }}
                  />
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteContent(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {content.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No content yet. Add content above to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
