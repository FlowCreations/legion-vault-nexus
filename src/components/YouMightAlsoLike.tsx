import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Music } from "lucide-react";
import { trackAffiliateContentClick, formatDuration, detectMusicPlatform } from "@/utils/affiliateAnalytics";
import { cn } from "@/lib/utils";

interface AffiliateContent {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  content_type: string | null;
  content_url: string | null;
  duration_ms: number | null;
  album_name: string | null;
  artist_name: string | null;
  affiliate: {
    name: string;
  };
}

interface YouMightAlsoLikeProps {
  contentType?: 'video' | 'music' | 'all';
  limit?: number;
}

export function YouMightAlsoLike({ contentType = 'all', limit = 4 }: YouMightAlsoLikeProps) {
  const [content, setContent] = useState<AffiliateContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAffiliateContent();
  }, [contentType]);

  const fetchAffiliateContent = async () => {
    let query = supabase
      .from("affiliate_content")
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        content_type,
        content_url,
        duration_ms,
        album_name,
        artist_name,
        affiliate:affiliates!inner(name, status)
      `)
      .eq('affiliate.status', 'active')
      .limit(limit);

    if (contentType !== 'all') {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query;

    if (!error && data) {
      // Transform the data structure
      const transformedData = data.map(item => ({
        ...item,
        affiliate: Array.isArray(item.affiliate) ? item.affiliate[0] : item.affiliate
      }));
      setContent(transformedData);
    }
    setLoading(false);
  };

  if (loading || content.length === 0) return null;

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>You May Also Like</CardTitle>
          <Button variant="ghost" size="sm">
            View All
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {content.map((item) => {
            const isMusicContent = item.content_type === 'music';
            const platform = item.content_url ? detectMusicPlatform(item.content_url) : '';
            
            return (
              <div
                key={item.id}
                className="group space-y-2"
              >
                <div 
                  className={cn(
                    "rounded-lg overflow-hidden bg-muted relative cursor-pointer",
                    isMusicContent ? "aspect-square" : "aspect-video"
                  )}
                  onClick={() => item.content_url && trackAffiliateContentClick(item.id, item.content_url)}
                >
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {isMusicContent ? <Music className="h-12 w-12" /> : <span>No Image</span>}
                    </div>
                  )}
                  
                  {/* Duration badge for music */}
                  {isMusicContent && item.duration_ms && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(item.duration_ms)}
                    </div>
                  )}
                  
                  {/* Platform badge */}
                  {platform && item.content_url?.includes('spotify.com') && (
                    <div className="absolute top-2 right-2 bg-[#1DB954] text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <Music className="h-3 w-3" />
                      {platform}
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm line-clamp-2 group-hover:text-affirmative-primary transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.artist_name || item.affiliate?.name || 'Affiliate Artist'}
                  </p>
                  {isMusicContent && item.album_name && (
                    <p className="text-xs text-muted-foreground">{item.album_name}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
