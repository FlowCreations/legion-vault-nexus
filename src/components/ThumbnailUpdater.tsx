import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

interface ThumbnailUpdaterProps {
  videoId: string;
  videoTitle: string;
}

export function ThumbnailUpdater({ videoId, videoTitle }: ThumbnailUpdaterProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to upload thumbnails",
          variant: "destructive",
        });
        return;
      }

      // Upload thumbnail to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_thumb.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, file);

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
        title: "Success",
        description: "Thumbnail updated successfully!",
      });

      // Reload the page to show new thumbnail
      window.location.reload();
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast({
        title: "Error",
        description: "Failed to upload thumbnail",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept="image/*"
        onChange={handleThumbnailUpload}
        disabled={uploading}
        className="hidden"
        id={`thumbnail-${videoId}`}
      />
      <label htmlFor={`thumbnail-${videoId}`}>
        <Button
          size="sm"
          variant="outline"
          disabled={uploading}
          asChild
        >
          <span className="cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Uploading..." : "Update Thumbnail"}
          </span>
        </Button>
      </label>
    </div>
  );
}
