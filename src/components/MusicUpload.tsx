import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Upload, X, Music, Trash2, Play } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MusicUploadProps {
  onUploadComplete?: () => void;
}

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  track_number: number | null;
  duration: string;
  year: string | null;
  category: string;
  public_url: string;
  created_at: string;
}

export default function MusicUpload({ onUploadComplete }: MusicUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("Sons of Legion");
  const [album, setAlbum] = useState("");
  const [trackNumber, setTrackNumber] = useState("");
  const [duration, setDuration] = useState("");
  const [year, setYear] = useState("");
  const [category, setCategory] = useState("single");
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingCoverId, setUploadingCoverId] = useState<string | null>(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from("music_tracks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTracks(data || []);
    } catch (error: any) {
      console.error("Error fetching tracks:", error);
      toast.error("Failed to load tracks");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/mp4", "audio/ogg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload MP3, WAV, FLAC, M4A, or OGG files.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 50MB.");
      return;
    }

    setSelectedFile(file);
    
    // Auto-fill title from filename
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    setTitle(fileName);

    // Extract duration from audio file
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      const minutes = Math.floor(audio.duration / 60);
      const seconds = Math.floor(audio.duration % 60);
      setDuration(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      URL.revokeObjectURL(audio.src);
    };
  };

  const handleUpload = async () => {
    if (!selectedFile || !title || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to upload music");
        return;
      }

      // Upload audio file to Supabase Storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("music-tracks")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("music-tracks")
        .getPublicUrl(filePath);

      let coverArtUrl = null;

      // Upload cover art if provided
      if (coverArtFile) {
        const coverExt = coverArtFile.name.split(".").pop();
        const coverFileName = `cover-${Date.now()}.${coverExt}`;
        const coverPath = `music-covers/${coverFileName}`;

        const { error: coverUploadError } = await supabase.storage
          .from("thumbnails")
          .upload(coverPath, coverArtFile, { upsert: true });

        if (coverUploadError) throw coverUploadError;

        const { data: { publicUrl: coverPublicUrl } } = supabase.storage
          .from("thumbnails")
          .getPublicUrl(coverPath);

        coverArtUrl = coverPublicUrl;
      }

      // Insert track metadata into database
      const { error: dbError } = await supabase
        .from("music_tracks")
        .insert({
          title,
          artist,
          album: album || null,
          track_number: trackNumber ? parseInt(trackNumber) : null,
          duration,
          year: year || null,
          category,
          storage_path: filePath,
          public_url: publicUrl,
          image_url: coverArtUrl,
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      toast.success("Track uploaded successfully!");
      
      // Reset form
      setSelectedFile(null);
      setCoverArtFile(null);
      setTitle("");
      setArtist("Sons of Legion");
      setAlbum("");
      setTrackNumber("");
      setDuration("");
      setYear("");
      setCategory("single");
      
      // Refresh track list
      fetchTracks();
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload track");
    } finally {
      setUploading(false);
    }
  };

  const handleCoverArtUpload = async (trackId: string, file: File) => {
    try {
      setUploadingCoverId(trackId);

      const fileExt = file.name.split('.').pop();
      const fileName = `${trackId}-${Date.now()}.${fileExt}`;
      const filePath = `music-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('music_tracks')
        .update({ image_url: publicUrl })
        .eq('id', trackId);

      if (updateError) throw updateError;

      toast.success("Cover art updated successfully!");
      fetchTracks();
    } catch (error: any) {
      console.error("Cover art upload error:", error);
      toast.error("Failed to upload cover art");
    } finally {
      setUploadingCoverId(null);
    }
  };

  const handleDelete = async (trackId: string, storagePath: string) => {
    if (!confirm("Are you sure you want to delete this track?")) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("music-tracks")
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("music_tracks")
        .delete()
        .eq("id", trackId);

      if (dbError) throw dbError;

      toast.success("Track deleted successfully");
      fetchTracks();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete track");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload Form */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Upload Music Track</h2>
          <p className="text-muted-foreground">
            Upload tracks to your music library. Supports MP3, WAV, FLAC, M4A, and OGG (max 50MB).
          </p>
        </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="music-file">Audio File *</Label>
            {selectedFile ? (
              <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
                <Music className="w-5 h-5 text-primary" />
                <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  id="music-file"
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/flac,audio/mp4,audio/ogg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="music-file" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP3, WAV, FLAC, M4A, or OGG (max 50MB)
                  </p>
                </label>
              </div>
            )}
          </div>

          {/* Cover Art Upload */}
          <div className="space-y-2">
            <Label htmlFor="cover-art">Cover Art (Optional)</Label>
            {coverArtFile ? (
              <div className="space-y-2">
                <img
                  src={URL.createObjectURL(coverArtFile)}
                  alt="Cover art preview"
                  className="w-32 h-32 rounded object-cover"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCoverArtFile(null)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove Cover Art
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  id="cover-art"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setCoverArtFile(file);
                  }}
                  className="hidden"
                />
                <label htmlFor="cover-art" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Upload album/single cover art
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, or WEBP
                  </p>
                </label>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Track Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter track title"
            />
          </div>

          {/* Artist */}
          <div className="space-y-2">
            <Label htmlFor="artist">Artist</Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name"
            />
          </div>

          {/* Album & Track Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="album">Album</Label>
              <Input
                id="album"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="Album name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="track-number">Track #</Label>
              <Input
                id="track-number"
                type="number"
                value={trackNumber}
                onChange={(e) => setTrackNumber(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          {/* Duration & Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="3:45"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="ep">EP</SelectItem>
                <SelectItem value="album">Album Track</SelectItem>
                <SelectItem value="live">Live Performance</SelectItem>
                <SelectItem value="remix">Remix</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleUpload}
          disabled={uploading || !selectedFile || !title || !category}
          className="w-full"
        >
          {uploading ? "Uploading..." : "Upload Track"}
        </Button>
      </Card>
      </div>

      {/* Uploaded Tracks List */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Uploaded Tracks</h2>
          <p className="text-muted-foreground">
            {tracks.length} {tracks.length === 1 ? "track" : "tracks"} in your library
          </p>
        </div>

        <Card className="p-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading tracks...
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tracks uploaded yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {tracks.map((track) => (
                  <Card key={track.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Music className="w-4 h-4 text-primary flex-shrink-0" />
                          <h3 className="font-semibold truncate">{track.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {track.artist}
                        </p>
                        {track.album && (
                          <p className="text-xs text-muted-foreground">
                            {track.album}
                            {track.track_number && ` • Track ${track.track_number}`}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="capitalize">{track.category}</span>
                          {track.duration && <span>• {track.duration}</span>}
                          {track.year && <span>• {track.year}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`cover-upload-${track.id}`}
                          className="cursor-pointer"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={uploadingCoverId === track.id}
                            asChild
                          >
                            <span title="Upload cover art">
                              <Upload className="w-4 h-4" />
                            </span>
                          </Button>
                        </Label>
                        <Input
                          id={`cover-upload-${track.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCoverArtUpload(track.id, file);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(track.public_url, "_blank")}
                          title="Play track"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(track.id, track.public_url.split('/').slice(-2).join('/'))}
                          title="Delete track"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>
      </div>
    </div>
  );
}
