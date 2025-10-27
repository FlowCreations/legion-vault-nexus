import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Copy } from "lucide-react";

const PRE_BUILT_TEMPLATES = [
  {
    id: "vip-exclusive",
    name: "VIP Exclusive Offer",
    category: "promotion",
    targetSegment: "VIP Fans (>$200 spend)",
    thumbnail: "🌟",
    subject: "{{user_name}}, here's something special just for you",
    previewText: "Exclusive access for our most loyal fans",
    body: `Hey {{user_name}},

You're one of our top fans, and we wanted to give you first access to something special.

As someone who's supported us with over {{total_spend}} in purchases, you mean the world to us. That's why we're giving you exclusive early access to our new merch drop - 24 hours before anyone else.

🎁 Plus, use code VIP20 for 20% off your entire order.

This is our way of saying thank you for being part of our journey from the beginning.

[Shop VIP Collection]

Much love,
JRNY`,
  },
  {
    id: "welcome-new",
    name: "Welcome New Fan",
    category: "nurture",
    targetSegment: "New Subscribers",
    thumbnail: "👋",
    subject: "Welcome to the JRNY family, {{first_name}}!",
    previewText: "Here's what you need to know...",
    body: `Hey {{first_name}},

Welcome! We're stoked to have you here.

You just joined a community of thousands of fans who are part of this journey with us. Here's what you can expect:

🎵 Early access to new music
📧 Behind-the-scenes content
🎟️ Presale tickets to shows
🛍️ Exclusive merch drops

To get you started, here's a free download of our acoustic EP - just our thank you for joining.

[Download Free EP]

Can't wait to connect more,
JRNY`,
  },
  {
    id: "we-miss-you",
    name: "We Miss You",
    category: "engagement",
    targetSegment: "Cold Leads (re-engagement)",
    thumbnail: "💔",
    subject: "It's been a while, {{user_name}}...",
    previewText: "Come back and see what's new",
    body: `Hey {{user_name}},

We noticed it's been a while since we last connected, and we miss you!

A lot has happened since you last tuned in:
- New album "Walking On The Edge" just dropped
- We've been on tour across 20 cities
- The community has grown to over 10,000 strong

We'd love to have you back. Here's 15% off anything in our store as a "welcome back" gift.

[See What's New]

Hope to see you around,
JRNY`,
  },
  {
    id: "hot-deal",
    name: "Hot Deal Alert",
    category: "promotion",
    targetSegment: "Hot Leads (PTP > 70)",
    thumbnail: "🔥",
    subject: "{{first_name}}, this won't last long...",
    previewText: "Limited time offer - act fast!",
    body: `{{first_name}},

Quick heads up - we're running a flash sale and based on your engagement (you're crushing it with a {{ptp_score}} score!), we wanted to make sure you didn't miss it.

⏰ Next 24 hours only:
- 30% off all apparel
- Free shipping over $50
- Limited edition items included

You've been checking out our merch lately, so this felt like perfect timing.

[Shop Flash Sale]

Don't sleep on this one!
JRNY`,
  },
  {
    id: "behind-scenes",
    name: "Behind The Scenes",
    category: "engagement",
    targetSegment: "Engaged Fans",
    thumbnail: "📸",
    subject: "A peek behind the curtain, {{user_name}}",
    previewText: "Studio sessions, tour life, and more...",
    body: `What's up {{user_name}},

Wanted to give you a look at what we've been working on...

This week we've been in the studio working on some new tracks that are honestly our best work yet. The energy is insane and we can't wait for you to hear it.

[Watch Studio Session Video]

Also - we're headlining Red Rocks in August! Presale starts next week and you'll get first access.

Your {{era_label}} status means you're part of the inner circle, so consider this your heads up.

[Join Presale List]

Stay tuned,
JRNY`,
  },
  {
    id: "loyalty-reward",
    name: "Loyalty Reward",
    category: "nurture",
    targetSegment: "Loyal/Invested Fans",
    thumbnail: "🎁",
    subject: "Thank you for being incredible, {{first_name}}",
    previewText: "A special gift for you",
    body: `{{first_name}},

Real talk - fans like you are the reason we do this.

You've been with us through {{total_spend}} in support, countless streams, and you're always engaging with our content. That doesn't go unnoticed.

As a thank you, we're sending you:
- A signed poster (on the house)
- Early access to our next 3 releases
- VIP status for all future presales

No purchase necessary. This is just us saying thanks for being part of the family.

[Claim Your Gift]

We see you,
JRNY`,
  },
];

interface EmailTemplateLibraryProps {
  onSelectTemplate: (template: typeof PRE_BUILT_TEMPLATES[0]) => void;
  onPreviewTemplate: (template: typeof PRE_BUILT_TEMPLATES[0]) => void;
}

export function EmailTemplateLibrary({ onSelectTemplate, onPreviewTemplate }: EmailTemplateLibraryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {PRE_BUILT_TEMPLATES.map((template) => (
        <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="text-4xl">{template.thumbnail}</div>
              <Badge variant="secondary">{template.category}</Badge>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
              <p className="text-sm text-muted-foreground">{template.targetSegment}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Subject Line:</p>
              <p className="text-sm">{template.subject}</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onPreviewTemplate(template)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onSelectTemplate(template)}
              >
                <Copy className="w-4 h-4 mr-1" />
                Use Template
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
