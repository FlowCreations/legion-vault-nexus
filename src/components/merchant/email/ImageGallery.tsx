import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  Search, 
  Trash2, 
  Image as ImageIcon,
  HardDrive
} from 'lucide-react';
import { toast } from 'sonner';
import { useStorageQuota } from '@/hooks/useStorageQuota';

interface ImageGalleryProps {
  onSelectImage: (url: string, name: string) => void;
}

export function ImageGallery({ onSelectImage }: ImageGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const { data: quota } = useStorageQuota();

  const { data: assets, isLoading } = useQuery({
    queryKey: ['email-assets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('email_assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('email-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('email-assets')
        .getPublicUrl(filePath);

      // Get image dimensions
      const img = new Image();
      const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = URL.createObjectURL(file);
      });

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('email_assets')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
          width: dimensions.width,
          height: dimensions.height,
        });

      if (dbError) throw dbError;

      return { publicUrl, fileName: file.name };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-assets'] });
      queryClient.invalidateQueries({ queryKey: ['storage-quota'] });
      toast.success('Image uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload image');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from('email_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-assets'] });
      queryClient.invalidateQueries({ queryKey: ['storage-quota'] });
      toast.success('Image deleted');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      uploadMutation.mutate(file);
    }
  };

  const filteredAssets = assets?.filter(asset =>
    asset.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header with storage quota */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Media Library
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => document.getElementById('gallery-upload')?.click()}
            disabled={uploadMutation.isPending}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <input
            id="gallery-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {quota && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                Storage Used
              </span>
              <span>{quota.usedGB} GB / {quota.totalGB} GB</span>
            </div>
            <Progress value={quota.percentUsed} className="h-1.5" />
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Image Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Loading images...
            </div>
          ) : filteredAssets?.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                {searchQuery ? 'No images found' : 'No images uploaded yet'}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => document.getElementById('gallery-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload your first image
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredAssets?.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => onSelectImage(asset.file_url, asset.file_name)}
                >
                  <img
                    src={asset.file_url}
                    alt={asset.file_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(asset.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-xs text-white truncate">{asset.file_name}</p>
                    <p className="text-xs text-white/70">
                      {asset.width} × {asset.height}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
