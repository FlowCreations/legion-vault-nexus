import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

interface AutoGenerateThumbnailProps {
  videoId: string;
  videoStoragePath: string;
  videoTitle: string;
  onThumbnailGenerated?: () => void;
}

export const AutoGenerateThumbnail = ({
  videoId,
  videoStoragePath,
  videoTitle,
  onThumbnailGenerated,
}: AutoGenerateThumbnailProps) => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const generateThumbnail = async () => {
    setGenerating(true);

    try {
      // Get the video URL
      const { data: videoData } = supabase.storage
        .from('videos')
        .getPublicUrl(videoStoragePath);

      // Create a hidden video element
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoData.publicUrl;
      video.muted = true;

      // Wait for video to load
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          // Generate a random position between 10% and 90% of the video duration
          // This ensures we avoid the very beginning and end which might be black frames
          const minPosition = video.duration * 0.1;
          const maxPosition = video.duration * 0.9;
          const randomSeekTime = minPosition + Math.random() * (maxPosition - minPosition);
          
          console.log(`Selecting frame at ${randomSeekTime.toFixed(2)}s of ${video.duration.toFixed(2)}s`);
          video.currentTime = randomSeekTime;
        };
        video.onseeked = resolve;
        video.onerror = reject;
      });

      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create thumbnail blob'));
          },
          'image/jpeg',
          0.9
        );
      });

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${videoId}-${timestamp}.jpg`;

      // Upload to thumbnails bucket
      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: thumbnailData } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(filename);

      // Update video record
      const { error: updateError } = await supabase
        .from('videos')
        .update({ thumbnail_url: thumbnailData.publicUrl })
        .eq('id', videoId);

      if (updateError) throw updateError;

      toast({
        title: "Thumbnail generated",
        description: "Auto-generated thumbnail from video",
      });

      onThumbnailGenerated?.();
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      toast({
        title: "Failed to generate thumbnail",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generateThumbnail}
      disabled={generating}
      className="border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/10"
    >
      {generating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          Auto-Generate
        </>
      )}
    </Button>
  );
};
