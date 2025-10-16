import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VideoUploadProps {
  onUploadComplete?: () => void;
}

export function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (500MB limit)
      if (file.size > 524288000) {
        toast({
          title: "File too large",
          description: "Video must be under 500MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      // Auto-fill title from filename if empty
      if (!title) {
        const filename = file.name.replace(/\.[^/.]+$/, "");
        setTitle(filename);
      }
    }
  };

  const generateThumbnail = async (videoFile: File): Promise<Blob> => {
    console.log('Generating thumbnail for:', videoFile.name);
    
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Could not get canvas context');
        reject(new Error('Could not get canvas context'));
        return;
      }

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      video.onloadeddata = () => {
        console.log('Video loaded, seeking to 2 seconds');
        video.currentTime = 2; // Capture frame at 2 seconds
      };
      
      video.onseeked = () => {
        console.log('Video seeked, capturing frame');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            console.log('Thumbnail blob created, size:', blob.size);
            URL.revokeObjectURL(video.src);
            resolve(blob);
          } else {
            console.error('Failed to create thumbnail blob');
            reject(new Error('Failed to create thumbnail'));
          }
        }, 'image/jpeg', 0.85);
      };
      
      video.onerror = (e) => {
        console.error('Video load error:', e);
        reject(new Error('Failed to load video'));
      };
      
      video.src = URL.createObjectURL(videoFile);
      console.log('Video source set, waiting for load');
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !title || !category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload videos",
          variant: "destructive",
        });
        setUploading(false);
        window.location.href = "/auth";
        return;
      }

      // Upload video to storage with category folder structure
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${category}/${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      console.log('Video uploaded, generating thumbnail...');

      // Generate and upload thumbnail
      let thumbnailUrl = '';
      try {
        const thumbnailBlob = await generateThumbnail(selectedFile);
        const thumbnailFileName = `${user.id}/${Date.now()}_thumb.jpg`;
        
        console.log('Uploading thumbnail to storage...');
        const { error: thumbUploadError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailFileName, thumbnailBlob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/jpeg'
          });

        if (thumbUploadError) {
          console.error('Thumbnail upload error:', thumbUploadError);
          throw thumbUploadError;
        }

        // Get thumbnail public URL
        const { data: { publicUrl } } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(thumbnailFileName);
        
        thumbnailUrl = publicUrl;
        console.log('Thumbnail uploaded successfully:', thumbnailUrl);
      } catch (thumbError) {
        console.error('Failed to generate/upload thumbnail:', thumbError);
        // Continue without thumbnail rather than failing the whole upload
      }

      // Save video metadata to database
      console.log('Saving video metadata to database...');
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          title,
          subtitle,
          category,
          storage_path: fileName,
          thumbnail_url: thumbnailUrl || null,
          is_premium: isPremium,
          uploaded_by: user.id
        });

      if (dbError) throw dbError;

      console.log('Video upload complete!');

      toast({
        title: "Upload successful",
        description: "Your video has been uploaded",
      });

      // Reset form
      setSelectedFile(null);
      setTitle("");
      setSubtitle("");
      setCategory("");
      setIsPremium(false);

      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 border border-border rounded-lg bg-card">
      <h3 className="text-xl font-semibold">Upload Video</h3>

      <div className="space-y-4">
        {/* File Input */}
        <div>
          <Label htmlFor="video-file">Video File *</Label>
          <div className="mt-2">
            {selectedFile ? (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="video-file"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload video (max 500MB)
                </span>
                <Input
                  id="video-file"
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
            className="mt-2"
          />
        </div>

        {/* Subtitle */}
        <div>
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g., Official Music Video, Live Performance"
            className="mt-2"
          />
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hero">Hero Video</SelectItem>
              <SelectItem value="music_videos">Music Videos</SelectItem>
              <SelectItem value="performances">Performances</SelectItem>
              <SelectItem value="behind_the_scenes">Behind The Scenes</SelectItem>
              <SelectItem value="documentary">Documentary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Premium Flag */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="premium"
            checked={isPremium}
            onCheckedChange={(checked) => setIsPremium(checked as boolean)}
          />
          <Label htmlFor="premium" className="cursor-pointer">
            Premium content (requires subscription)
          </Label>
        </div>

        {/* Upload Button */}
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleUpload();
          }}
          disabled={uploading || !selectedFile || !title || !category}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Video
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
