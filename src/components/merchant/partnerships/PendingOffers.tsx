import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, MapPin, TrendingUp, ChevronDown, CheckCircle, XCircle, MessageSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface PartnershipOffer {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar_url: string;
    portal_followers: number;
    social_followers: number;
    core_demographic: string;
    gender_distribution: { male: number; female: number; other: number };
    primary_location: string;
    behavioral_highlights: string[];
    ethos: {
      stands_for: string[];
      avoids: string[];
    };
  };
  partnership_type: string;
  offering: string;
  looking_for: string;
  duration: string;
  compensation: string;
  personal_message: string;
  compatibility_score: number;
  created_at: string;
  status: 'pending' | 'accepted' | 'declined';
}

const MOCK_OFFERS: PartnershipOffer[] = [
  {
    id: "1",
    sender: {
      id: "7",
      name: "Taylor Brooks",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
      portal_followers: 89200,
      social_followers: 425000,
      core_demographic: "Ages 22-35, Indie and alternative music lovers, Festival goers",
      gender_distribution: { male: 48, female: 50, other: 2 },
      primary_location: "Portland, OR, USA",
      behavioral_highlights: [
        "High engagement with indie and alternative content",
        "Active in local music scene and festivals",
        "Strong vinyl and physical merch sales",
        "Hosts weekly listening parties"
      ],
      ethos: {
        stands_for: ["Independent artists", "Authentic storytelling", "Community over commerce", "Environmental sustainability"],
        avoids: ["Mainstream exploitation", "Generic content", "Corporate greed", "Wasteful practices"]
      }
    },
    partnership_type: "Cross-promotion",
    offering: "Weekly feature on my portal (90K followers), social media shoutouts, playlist placements, and cross-promotion at local events",
    looking_for: "Similar cross-promotion on your platform, collaborative playlist creation, and potential co-hosting of live events",
    duration: "6 months initial, renewable",
    compensation: "Revenue share on collaborative events, split promotional costs",
    personal_message: "I've been following your work for a while and I'm really impressed by your authentic approach to building community. I think our audiences would really vibe with each other - we both seem to prioritize substance over hype. I'd love to explore how we can support each other's growth while staying true to our values. Let's create something meaningful together!",
    compatibility_score: 92,
    created_at: "2025-11-14T10:30:00Z",
    status: 'pending'
  },
  {
    id: "2",
    sender: {
      id: "8",
      name: "Maya Patel",
      avatar_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400",
      portal_followers: 62400,
      social_followers: 198000,
      core_demographic: "Ages 25-40, Wellness and mindfulness enthusiasts, Ambient and meditation music listeners",
      gender_distribution: { male: 32, female: 65, other: 3 },
      primary_location: "San Francisco, CA, USA",
      behavioral_highlights: [
        "High engagement during morning and evening routines",
        "Premium subscription retention at 94%",
        "Active in yoga and meditation communities",
        "Strong conversion on wellness retreat tickets"
      ],
      ethos: {
        stands_for: ["Mental health awareness", "Holistic wellness", "Mindful consumption", "Inner peace"],
        avoids: ["Toxic hustle culture", "Superficial wellness", "Materialism", "Stress-inducing content"]
      }
    },
    partnership_type: "Co-content creation",
    offering: "Collaborative meditation and music series, wellness retreat partnerships, dedicated content features, and introduction to wellness brands I work with",
    looking_for: "Music curation for wellness content, collaborative soundscapes, and cross-audience exposure",
    duration: "Ongoing with quarterly reviews",
    compensation: "50/50 revenue split on co-created content and events",
    personal_message: "Your music has this incredible calming quality that I think would resonate deeply with my wellness-focused audience. I'm looking to expand beyond just meditation music and I believe a partnership could introduce both of our communities to new dimensions of wellness and sound. Would love to discuss creating something transformative together.",
    compatibility_score: 85,
    created_at: "2025-11-13T14:45:00Z",
    status: 'pending'
  },
  {
    id: "3",
    sender: {
      id: "9",
      name: "Chris Anderson",
      avatar_url: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400",
      portal_followers: 124500,
      social_followers: 567000,
      core_demographic: "Ages 18-30, Gaming and streaming community, Electronic and synthwave fans",
      gender_distribution: { male: 78, female: 20, other: 2 },
      primary_location: "Austin, TX, USA",
      behavioral_highlights: [
        "Peak activity during gaming hours (6PM-2AM)",
        "High engagement with stream-friendly music",
        "Strong merch and digital content sales",
        "Influential in gaming and tech communities"
      ],
      ethos: {
        stands_for: ["Creator rights", "Gaming culture", "Tech innovation", "Community support"],
        avoids: ["Copyright strikes", "Anti-creator policies", "Toxic gaming culture", "Corporate exploitation"]
      }
    },
    partnership_type: "Affiliate marketing",
    offering: "Featured placement in my gaming streams (avg 15K concurrent viewers), dedicated music segments, affiliate links in stream descriptions, and Discord community promotion",
    looking_for: "Copyright-safe streaming music library, exclusive tracks for my community, and fair revenue sharing",
    duration: "12 months",
    compensation: "20% affiliate commission on all sales from my channels, plus upfront $2,500 sponsorship fee",
    personal_message: "I need more stream-safe music that actually slaps, and your catalog is exactly what I've been looking for. My audience is huge in the 18-30 demo and they're constantly asking me what music I'm playing. This could be a massive win-win - I get great music for streams, you get exposure to over 500K engaged followers who actually buy music and merch. Let's make this happen!",
    compatibility_score: 78,
    created_at: "2025-11-12T09:15:00Z",
    status: 'pending'
  }
];

export function PendingOffers() {
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);

  const handleAccept = (offerId: string, senderName: string) => {
    toast.success("Offer accepted!", {
      description: `Partnership with ${senderName} has been accepted. You'll receive a confirmation email shortly.`
    });
  };

  const handleDecline = (offerId: string, senderName: string) => {
    toast.info("Offer declined", {
      description: `You've declined the partnership offer from ${senderName}.`
    });
  };

  const handleRequestInfo = (offerId: string, senderName: string) => {
    toast.success("Request sent!", {
      description: `Your request for more information has been sent to ${senderName}.`
    });
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 85) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-orange-500";
  };

  const getCompatibilityText = (score: number) => {
    if (score >= 85) return "Excellent Match";
    if (score >= 70) return "Good Match";
    return "Moderate Match";
  };

  if (MOCK_OFFERS.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No pending partnership offers at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {MOCK_OFFERS.map((offer) => (
        <Collapsible
          key={offer.id}
          open={expandedOffer === offer.id}
          onOpenChange={(open) => setExpandedOffer(open ? offer.id : null)}
        >
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header with Profile */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="w-16 h-16 border-2 border-primary/20">
                      <AvatarImage src={offer.sender.avatar_url} alt={offer.sender.name} />
                      <AvatarFallback>{offer.sender.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{offer.sender.name}</h3>
                        <Badge variant="outline" className="capitalize">{offer.partnership_type}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{(offer.sender.portal_followers / 1000).toFixed(1)}K</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>{(offer.sender.social_followers / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{offer.sender.primary_location}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {offer.sender.core_demographic}
                      </p>
                    </div>
                  </div>

                  {/* Compatibility Score */}
                  <div className="text-center">
                    <div className={`flex items-center gap-1 text-2xl font-bold ${getCompatibilityColor(offer.compatibility_score)}`}>
                      <Sparkles className="w-5 h-5" />
                      <span>{offer.compatibility_score}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{getCompatibilityText(offer.compatibility_score)}</p>
                  </div>
                </div>

                {/* Offer Summary */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-xs text-muted-foreground uppercase mb-1">Duration</p>
                      <p>{offer.duration || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-muted-foreground uppercase mb-1">Compensation</p>
                      <p>{offer.compensation || "To be discussed"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-muted-foreground uppercase mb-1">Personal Message</p>
                    <p className="text-sm line-clamp-2">{offer.personal_message}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${expandedOffer === offer.id ? 'rotate-180' : ''}`} />
                      {expandedOffer === offer.id ? 'Hide' : 'View'} Full Details
                    </Button>
                  </CollapsibleTrigger>
                  <Button
                    variant="default"
                    onClick={() => handleAccept(offer.id, offer.sender.name)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRequestInfo(offer.id, offer.sender.name)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Request Info
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleDecline(offer.id, offer.sender.name)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>

                {/* Expandable Full Details */}
                <CollapsibleContent className="space-y-4 pt-4 border-t">
                  {/* Detailed Demographics */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Gender Distribution</h4>
                      <div className="flex gap-2">
                        <Badge variant="secondary">♂ {offer.sender.gender_distribution.male}%</Badge>
                        <Badge variant="secondary">♀ {offer.sender.gender_distribution.female}%</Badge>
                        {offer.sender.gender_distribution.other > 0 && (
                          <Badge variant="secondary">⚥ {offer.sender.gender_distribution.other}%</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Behavioral Highlights</h4>
                      <ul className="space-y-1">
                        {offer.sender.behavioral_highlights.map((highlight, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Ethos */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">What They Stand For</h4>
                      <div className="flex flex-wrap gap-2">
                        {offer.sender.ethos.stands_for.map((value, idx) => (
                          <Badge key={idx} variant="default">{value}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">What They Avoid</h4>
                      <div className="flex flex-wrap gap-2">
                        {offer.sender.ethos.avoids.map((value, idx) => (
                          <Badge key={idx} variant="outline">{value}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Partnership Details */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">What They're Offering</h4>
                      <p className="text-sm text-muted-foreground">{offer.offering}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">What They're Looking For</h4>
                      <p className="text-sm text-muted-foreground">{offer.looking_for}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Full Personal Message</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{offer.personal_message}</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </CardContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
}
