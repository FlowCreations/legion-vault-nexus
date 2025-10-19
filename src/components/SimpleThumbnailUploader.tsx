import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { setVideoThumbnail } from "@/utils/thumbnailHelper";

interface SimpleThumbnailUploaderProps {
  videoId: string;
  videoTitle: string;
  onUploadComplete?: () => void;
}

export function SimpleThumbnailUploader({ 
  videoId, 
  videoTitle,
  onUploadComplete 
}: SimpleThumbnailUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      await setVideoThumbnail(videoId, file);

      toast({
        title: "Success!",
        description: "Thumbnail uploaded successfully",
      });

      // Call the callback to refresh the video list
      if (onUploadComplete) {
        onUploadComplete();
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleImageUpload}
        disabled={uploading}
        className="hidden"
        id={`thumb-upload-${videoId}`}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={uploading}
        onClick={() => {
          document.getElementById(`thumb-upload-${videoId}`)?.click();
        }}
      >
        <Upload className="w-4 h-4 mr-2" />
        {uploading ? "Uploading..." : "Upload Thumbnail"}
      </Button>
    </div>
  );
}
