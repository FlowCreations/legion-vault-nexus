import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Music, Save, Edit, X } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  lyrics: string | null;
}

export const LyricsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [lyricsText, setLyricsText] = useState("");

  const { data: tracks, isLoading } = useQuery({
    queryKey: ['music-tracks-lyrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_tracks')
        .select('id, title, artist, album, lyrics')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Track[];
    },
  });

  const updateLyricsMutation = useMutation({
    mutationFn: async ({ trackId, lyrics }: { trackId: string; lyrics: string }) => {
      const { error } = await supabase
        .from('music_tracks')
        .update({ lyrics })
        .eq('id', trackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['music-tracks-lyrics'] });
      queryClient.invalidateQueries({ queryKey: ['music-tracks'] });
      setEditingTrackId(null);
      setLyricsText("");
      toast({
        title: "Lyrics updated!",
        description: "The lyrics have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lyrics. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditClick = (track: Track) => {
    setEditingTrackId(track.id);
    setLyricsText(track.lyrics || "");
  };

  const handleSave = (trackId: string) => {
    updateLyricsMutation.mutate({ trackId, lyrics: lyricsText });
  };

  const handleCancel = () => {
    setEditingTrackId(null);
    setLyricsText("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading tracks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Lyrics Manager
        </h2>
        <p className="text-muted-foreground mt-1">
          Add or edit lyrics for your tracks. Paste the lyrics for each song below.
        </p>
      </div>

      <div className="grid gap-4">
        {tracks?.map((track) => (
          <Card key={track.id} className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>
                  {track.title}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    by {track.artist}
                  </span>
                </span>
                {editingTrackId === track.id ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(track.id)}
                      disabled={updateLyricsMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancel}
                      disabled={updateLyricsMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditClick(track)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {track.lyrics ? "Edit" : "Add"} Lyrics
                  </Button>
                )}
              </CardTitle>
              <CardDescription>{track.album}</CardDescription>
            </CardHeader>
            <CardContent>
              {editingTrackId === track.id && (
                <Textarea
                  value={lyricsText}
                  onChange={(e) => setLyricsText(e.target.value)}
                  placeholder="Paste the song lyrics here..."
                  className="min-h-[300px] font-mono text-sm"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
