import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SimpleThumbnailUploaderProps {
  videoId: string;
  videoTitle: string;
}

export function SimpleThumbnailUploader({ 
  videoId, 
  videoTitle 
}: SimpleThumbnailUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        });
        return;
      }

      // Upload image to thumbnails bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_thumb.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
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
        description: "Thumbnail uploaded successfully",
      });

      // Reload to show new thumbnail
      setTimeout(() => window.location.reload(), 500);

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
    <div>
      <Input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        disabled={uploading}
        className="hidden"
        id={`thumb-upload-${videoId}`}
      />
      <label htmlFor={`thumb-upload-${videoId}`}>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading}
          asChild
        >
          <span className="cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Uploading..." : "Upload Thumbnail"}
          </span>
        </Button>
      </label>
    </div>
  );
}
