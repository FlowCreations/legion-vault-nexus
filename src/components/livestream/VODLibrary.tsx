import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Clock, Play, Search } from 'lucide-react';
import { toast } from 'sonner';

interface VOD {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  view_count: number;
  stream_started_at: string;
  processing_status: string;
}

interface VODLibraryProps {
  onSelectVOD?: (vodId: string) => void;
}

export function VODLibrary({ onSelectVOD }: VODLibraryProps) {
  const [vods, setVods] = useState<VOD[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadVODs();

    // Subscribe to new VODs
    const channel = supabase
      .channel('vods-library')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'livestream_vods'
      }, () => {
        loadVODs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadVODs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('livestream_vods')
        .select('*')
        .order('stream_started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setVods((data as unknown) as VOD[]);
    } catch (error) {
      console.error('Error loading VODs:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const filteredVODs = vods.filter(vod => 
    vod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vod.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Past Streams</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Past Streams ({vods.length})</span>
        </CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredVODs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {searchQuery ? 'No videos found' : 'No past streams yet'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVODs.map((vod) => (
              <div
                key={vod.id}
                className="group border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => onSelectVOD?.(vod.id)}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-muted relative">
                  {vod.thumbnail_url ? (
                    <img
                      src={vod.thumbnail_url}
                      alt={vod.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Duration badge */}
                  <Badge className="absolute bottom-2 right-2 bg-black/80 text-white">
                    {formatDuration(vod.duration_seconds)}
                  </Badge>

                  {/* Processing status */}
                  {vod.processing_status !== 'completed' && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 left-2"
                    >
                      {vod.processing_status}
                    </Badge>
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary/0 group-hover:bg-primary transition-colors flex items-center justify-center">
                      <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <h3 className="font-medium line-clamp-2 text-sm">{vod.title}</h3>
                  {vod.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {vod.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {vod.view_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(vod.stream_started_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
