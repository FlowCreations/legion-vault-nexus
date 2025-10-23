import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";
import { trackAffiliateContentClick } from "@/utils/affiliateAnalytics";

interface AffiliateContent {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  content_type: string | null;
  content_url: string | null;
  affiliates: {
    name: string;
  } | null;
}

interface AffiliateRecommendationsProps {
  contentType?: 'video' | 'music' | 'all';
  limit?: number;
}

export function AffiliateRecommendations({ contentType = 'all', limit = 5 }: AffiliateRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<AffiliateContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [contentType, limit]);

  const fetchRecommendations = async () => {
    let query = supabase
      .from('affiliate_content')
      .select(`
        *,
        affiliates (
          name
        )
      `)
      .limit(limit);

    if (contentType !== 'all') {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query;

    if (!error && data) {
      setRecommendations(data);
    }
    setLoading(false);
  };

  if (loading || recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>You May Also Like</CardTitle>
        <CardDescription>Recommendations from our affiliates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {recommendations.map((item) => (
            <div
              key={item.id}
              className="group cursor-pointer space-y-2"
              onClick={() => item.content_url && trackAffiliateContentClick(item.id, item.content_url)}
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
                    <ExternalLink className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <p className="font-medium text-sm line-clamp-2 group-hover:text-affirmative-primary transition-colors">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.affiliates?.name || 'Affiliate Artist'}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Button variant="outline" size="sm">
            View More Recommendations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
