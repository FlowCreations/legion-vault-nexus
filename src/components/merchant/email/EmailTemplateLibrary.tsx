import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Rocket, Music, Calendar, Gift, Sparkles } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: 'product' | 'tour' | 'album' | 'promo' | 'engagement';
  thumbnail: string;
  subject: string;
  body: string;
  icon: any;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Announce new merchandise or products',
    category: 'product',
    icon: Rocket,
    thumbnail: 'bg-gradient-to-br from-blue-500 to-purple-600',
    subject: '🚀 New Drop Alert: {{product_name}}',
    body: `Hey {{first_name}},

Something special just dropped.

Introducing {{product_name}} - designed exclusively for the community.

{{product_description}}

Limited quantities available. Get yours before they're gone.

[Shop Now]

- {{artist_name}}`
  },
  {
    id: 'tour-announcement',
    name: 'Tour Announcement',
    description: 'Announce tour dates and ticket sales',
    category: 'tour',
    icon: Calendar,
    thumbnail: 'bg-gradient-to-br from-orange-500 to-red-600',
    subject: '🎤 We\'re Coming to {{city}}!',
    body: `{{first_name}},

Mark your calendar. I'm hitting the road.

TOUR DATES:
{{tour_dates}}

Presale starts {{presale_date}}
General sale: {{general_sale_date}}

As a VIP member, you get first access to tickets + exclusive merch.

[Get Presale Access]

See you there!
- {{artist_name}}`
  },
  {
    id: 'album-release',
    name: 'Album Release',
    description: 'Announce new album or EP release',
    category: 'album',
    icon: Music,
    thumbnail: 'bg-gradient-to-br from-green-500 to-teal-600',
    subject: '🎵 {{album_name}} is Here',
    body: `Hey {{first_name}},

Today's the day. {{album_name}} is officially out.

This project has been months in the making, and I can't wait for you to hear it.

{{album_description}}

Stream it everywhere:
🎧 Spotify | Apple Music | YouTube

[Listen Now]

Let me know what you think.
- {{artist_name}}`
  },
  {
    id: 'exclusive-content',
    name: 'Exclusive Content Drop',
    description: 'Share exclusive content with fans',
    category: 'engagement',
    icon: Gift,
    thumbnail: 'bg-gradient-to-br from-pink-500 to-rose-600',
    subject: '🎁 Exclusive Content Just for You',
    body: `{{first_name}},

You're one of my top supporters, so you get this first.

{{content_description}}

This is available only to VIP members for the next 48 hours.

[Access Exclusive Content]

Thanks for being part of the journey.
- {{artist_name}}`
  },
  {
    id: 'discount-promo',
    name: 'Limited Time Discount',
    description: 'Promote limited time offers',
    category: 'promo',
    icon: Sparkles,
    thumbnail: 'bg-gradient-to-br from-yellow-500 to-orange-600',
    subject: '⚡ 24-Hour Flash Sale: {{discount}}% Off',
    body: `Hey {{first_name}},

Flash sale alert 🚨

Get {{discount}}% off everything in the store for the next 24 hours.

Use code: {{promo_code}}

This includes:
✓ All merch
✓ Exclusive vinyl
✓ Digital downloads

[Shop Now]

Sale ends {{end_date}}
- {{artist_name}}`
  },
  {
    id: 'behind-the-scenes',
    name: 'Behind the Scenes',
    description: 'Share studio updates and BTS content',
    category: 'engagement',
    icon: Mail,
    thumbnail: 'bg-gradient-to-br from-indigo-500 to-blue-600',
    subject: '📹 Behind the Scenes: {{content_title}}',
    body: `What's up {{first_name}},

Wanted to give you a peek behind the curtain.

{{bts_description}}

[Watch Behind the Scenes]

More coming soon. Stay tuned.
- {{artist_name}}`
  }
];

interface EmailTemplateLibraryProps {
  onSelectTemplate: (template: EmailTemplate) => void;
}

export function EmailTemplateLibrary({ onSelectTemplate }: EmailTemplateLibraryProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Email Template Library</h3>
        <p className="text-sm text-muted-foreground">
          Choose a pre-designed template to get started quickly
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EMAIL_TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`h-32 ${template.thumbnail} flex items-center justify-center`}>
                <Icon className="h-12 w-12 text-white" />
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
                <Button 
                  onClick={() => onSelectTemplate(template)} 
                  className="w-full"
                  size="sm"
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
