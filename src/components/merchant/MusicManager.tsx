import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GripVertical, Upload, Save, RefreshCw } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  image_url: string | null;
  display_order: number | null;
  public_url: string;
}

export const MusicManager = () => {
  const { toast } = useToast();
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('music_tracks')
        .select('id, title, artist, album, image_url, display_order, public_url')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTracks(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading tracks",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(tracks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update display_order for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index + 1,
    }));

    setTracks(updatedItems);
  };

  const handleCoverArtUpload = async (trackId: string, file: File) => {
    try {
      setUploadingId(trackId);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${trackId}-${Date.now()}.${fileExt}`;
      const filePath = `music-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(filePath);

      // Update database
      const { error: updateError } = await supabase
        .from('music_tracks')
        .update({ image_url: publicUrl })
        .eq('id', trackId);

      if (updateError) throw updateError;

      // Update local state
      setTracks(tracks.map(track => 
        track.id === trackId ? { ...track, image_url: publicUrl } : track
      ));

      toast({
        title: "Cover art updated",
        description: "The track cover art has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading cover art",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
    }
  };

  const saveOrder = async () => {
    try {
      setSaving(true);

      // Update all tracks with new display_order
      const updates = tracks.map((track, index) => ({
        id: track.id,
        display_order: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('music_tracks')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: "Order saved",
        description: "Track order has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving order",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading tracks...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Music Track Manager</CardTitle>
          <Button onClick={saveOrder} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Order"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Drag and drop tracks to reorder them. Upload new cover art for each track.
        </p>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tracks">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {tracks.map((track, index) => (
                  <Draggable key={track.id} draggableId={track.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-card border rounded-lg p-4 ${
                          snapshot.isDragging ? 'shadow-lg' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div {...provided.dragHandleProps} className="cursor-grab">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>
                          
                          <div className="flex-shrink-0">
                            <img
                              src={track.image_url || '/placeholder.svg'}
                              alt={track.title}
                              className="w-16 h-16 rounded object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{track.title}</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {track.artist} • {track.album}
                            </p>
                          </div>

                          <div className="flex-shrink-0">
                            <Label
                              htmlFor={`cover-${track.id}`}
                              className="cursor-pointer"
                            >
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploadingId === track.id}
                                asChild
                              >
                                <span>
                                  <Upload className="mr-2 h-4 w-4" />
                                  {uploadingId === track.id ? "Uploading..." : "Cover Art"}
                                </span>
                              </Button>
                            </Label>
                            <Input
                              id={`cover-${track.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleCoverArtUpload(track.id, file);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  );
};
