import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Upload, X, Music } from "lucide-react";
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

export default function MusicUpload({ onUploadComplete }: MusicUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("Sons of Legion");
  const [album, setAlbum] = useState("");
  const [trackNumber, setTrackNumber] = useState("");
  const [duration, setDuration] = useState("");
  const [year, setYear] = useState("");
  const [category, setCategory] = useState("single");

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
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      toast.success("Track uploaded successfully!");
      
      // Reset form
      setSelectedFile(null);
      setTitle("");
      setArtist("Sons of Legion");
      setAlbum("");
      setTrackNumber("");
      setDuration("");
      setYear("");
      setCategory("single");
      
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

  return (
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
  );
}
