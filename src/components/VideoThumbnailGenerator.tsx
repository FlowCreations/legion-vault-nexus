import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ImageIcon } from "lucide-react";

interface VideoThumbnailGeneratorProps {
  videoId: string;
  videoUrl: string;
  videoTitle: string;
}

export function VideoThumbnailGenerator({ 
  videoId, 
  videoUrl, 
  videoTitle 
}: VideoThumbnailGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const generateThumbnail = async () => {
    console.log('Starting thumbnail generation for:', videoTitle);
    
    try {
      setGenerating(true);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) {
        throw new Error("Video or canvas not ready");
      }

      console.log('Loading video from:', videoUrl);

      // Load video
      video.src = videoUrl;
      
      // Wait for video to load
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video loading timeout'));
        }, 10000); // 10 second timeout
        
        video.onloadeddata = () => {
          console.log('Video loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
          clearTimeout(timeout);
          resolve();
        };
        video.onerror = (e) => {
          clearTimeout(timeout);
          console.error('Video load error:', e);
          reject(new Error('Failed to load video'));
        };
      });

      // Seek to 2 seconds into the video for a better thumbnail
      console.log('Seeking to 2 seconds...');
      video.currentTime = 2;
      
      await new Promise<void>((resolve) => {
        video.onseeked = () => {
          console.log('Video seeked successfully');
          resolve();
        };
      });

      // Draw video frame to canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Could not create blob"));
          },
          'image/jpeg',
          0.9
        );
      });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in");
      }

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}_thumb.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(fileName);

      // Update video record
      const { error: updateError } = await supabase
        .from('videos')
        .update({ thumbnail_url: publicUrl })
        .eq('id', videoId);

      if (updateError) throw updateError;

      toast({
        title: "Success!",
        description: "Thumbnail generated and saved",
      });

      // Reload page to show new thumbnail
      setTimeout(() => window.location.reload(), 1000);

    } catch (error) {
      console.error('Error generating thumbnail:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate thumbnail",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          generateThumbnail();
        }}
        disabled={generating}
      >
        <ImageIcon className="w-4 h-4 mr-2" />
        {generating ? "Generating..." : "Generate Thumbnail"}
      </Button>
      
      {/* Hidden video and canvas elements */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="hidden"
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
