import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

interface AffiliateContent {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  content_type: string | null;
  content_url: string | null;
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
          {content.map((item) => (
            <div
              key={item.id}
              className="group cursor-pointer space-y-2"
              onClick={() => item.content_url && window.open(item.content_url, '_blank')}
            >
              <div className="aspect-video rounded-lg overflow-hidden bg-muted relative">
                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <p className="font-medium text-sm line-clamp-2 group-hover:text-affirmative-primary transition-colors">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.affiliate?.name || 'Affiliate Artist'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
