import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface BrandPartnership {
  id: string;
  brand_name: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  content: {
    featured_products?: Array<{
      title: string;
      image_url: string;
      link: string;
    }>;
  };
}

interface BrandPartnershipCardProps {
  partnership: BrandPartnership;
}

export function BrandPartnershipCard({ partnership }: BrandPartnershipCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6 space-y-4">
        {/* Brand Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {partnership.logo_url ? (
              <img
                src={partnership.logo_url}
                alt={partnership.brand_name}
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            {partnership.logo_url && (
              <div className="h-12 w-24 bg-muted rounded items-center justify-center" style={{ display: 'none' }}>
                <span className="font-bold">{partnership.brand_name}</span>
              </div>
            )}
            {!partnership.logo_url && (
              <div className="h-12 w-24 bg-muted rounded flex items-center justify-center">
                <span className="font-bold">{partnership.brand_name}</span>
              </div>
            )}
          </div>
          {partnership.website_url && (
            <Button variant="ghost" size="sm" asChild>
              <a href={partnership.website_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>

        {/* Description */}
        {partnership.description && (
          <p className="text-sm text-muted-foreground">{partnership.description}</p>
        )}

        {/* Featured Products */}
        {partnership.content.featured_products && partnership.content.featured_products.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Featured</h4>
            <div className="grid grid-cols-2 gap-3">
              {partnership.content.featured_products.map((product, idx) => (
                <a
                  key={idx}
                  href={product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group space-y-2"
                >
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.src = '';
                        e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Image</div>';
                      }}
                    />
                  </div>
                  <p className="text-xs font-medium line-clamp-2 group-hover:text-affirmative-primary transition-colors">
                    {product.title}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
