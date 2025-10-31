import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Play, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMusicPlayer } from "@/stores/musicPlayerStore";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  public_url: string;
  image_url: string | null;
  duration: string;
}

export default function EPsSingles() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { setCurrentTrack, setPlaylist, setIsPlaying } = useMusicPlayer();

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from("music_tracks")
        .select("*")
        .in("category", ["single", "ep"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setTracks(data);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (track: Track, index: number) => {
    const formattedTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album || "",
      time: track.duration,
      url: track.public_url,
      image: track.image_url || "/albums/stripped-album.jpg",
    };

    const formattedTracks = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album || "",
      time: t.duration,
      url: t.public_url,
      image: t.image_url || "/albums/stripped-album.jpg",
    }));

    setPlaylist(formattedTracks, index);
    setCurrentTrack(formattedTrack);
    setIsPlaying(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-32">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/music")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Music
        </Button>

        <h1 className="text-4xl font-bold mb-2">Singles</h1>
        <p className="text-muted-foreground mb-8">
          All released singles
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className="group relative bg-card rounded-lg overflow-hidden hover:bg-accent/50 transition-all cursor-pointer"
            >
              <div className="aspect-square relative">
                <img
                  src={track.image_url || "/albums/stripped-album.jpg"}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="icon"
                    className="w-14 h-14 rounded-full"
                    onClick={() => handlePlayTrack(track, index)}
                  >
                    <Play className="w-6 h-6 fill-current" />
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold truncate">{track.title}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {track.artist}
                </p>
                {track.album && (
                  <p className="text-xs text-muted-foreground truncate">
                    {track.album}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {tracks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No singles found</p>
          </div>
        )}
      </div>
    </div>
  );
}
