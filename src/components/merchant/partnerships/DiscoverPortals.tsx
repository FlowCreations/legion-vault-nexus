import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, MapPin, TrendingUp, Send } from "lucide-react";
import { PartnershipOfferDialog } from "./PartnershipOfferDialog";

interface Portal {
  id: string;
  name: string;
  avatar_url: string;
  portal_followers: number;
  social_followers: number;
  core_demographic: string;
  gender_distribution: {
    male: number;
    female: number;
    other: number;
  };
  primary_location: string;
  behavioral_highlights: string[];
  personal_message: string;
  ethos: {
    stands_for: string[];
    avoids: string[];
  };
}

const MOCK_PORTALS: Portal[] = [
  {
    id: "1",
    name: "Sarah Chen",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    portal_followers: 45200,
    social_followers: 128000,
    core_demographic: "Ages 25-34, Urban professionals, Creative industry workers",
    gender_distribution: { male: 35, female: 62, other: 3 },
    primary_location: "Los Angeles, CA, USA",
    behavioral_highlights: [
      "High engagement on weekend evenings",
      "Shares lifestyle and wellness content",
      "Active in fitness and mindfulness communities",
      "Premium subscriber with high conversion rate"
    ],
    personal_message: "Building authentic connections through music, wellness, and creative expression. Looking to collaborate with like-minded artists who value community over clout.",
    ethos: {
      stands_for: ["Authenticity", "Mental wellness", "Body positivity", "Sustainable living", "Creative freedom"],
      avoids: ["Fast fashion", "Toxic positivity", "Unrealistic beauty standards", "Exploitative practices"]
    }
  },
  {
    id: "2",
    name: "Marcus Thompson",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    portal_followers: 68500,
    social_followers: 215000,
    core_demographic: "Ages 18-28, College students, Hip-hop and R&B enthusiasts",
    gender_distribution: { male: 58, female: 40, other: 2 },
    primary_location: "Atlanta, GA, USA",
    behavioral_highlights: [
      "Peak activity during late nights (10PM-2AM)",
      "High merchandise purchase rate",
      "Shares underground hip-hop and emerging artists",
      "Organizes local community events"
    ],
    personal_message: "Champion of underground talent and authentic hip-hop culture. Passionate about giving emerging artists a platform and building real community.",
    ethos: {
      stands_for: ["Underground culture", "Artist empowerment", "Cultural authenticity", "Community building", "Social justice"],
      avoids: ["Mainstream sellouts", "Cultural appropriation", "Corporate exploitation", "Fake personas"]
    }
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    portal_followers: 52300,
    social_followers: 187000,
    core_demographic: "Ages 22-35, Latin music lovers, Festival goers",
    gender_distribution: { male: 42, female: 56, other: 2 },
    primary_location: "Miami, FL, USA",
    behavioral_highlights: [
      "High engagement with live events and festivals",
      "Shares dancehall, reggaeton, and Latin pop",
      "Active in travel and lifestyle communities",
      "Strong affiliate conversion on event tickets"
    ],
    personal_message: "Celebrating Latin culture through music, dance, and unforgettable experiences. Looking for partners who understand the power of bringing people together.",
    ethos: {
      stands_for: ["Cultural pride", "Joy and celebration", "Family values", "Inclusivity", "Live experiences"],
      avoids: ["Cultural stereotypes", "Exclusivity", "Overcommercialization", "Negative energy"]
    }
  },
  {
    id: "4",
    name: "Alex Park",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    portal_followers: 38900,
    social_followers: 95000,
    core_demographic: "Ages 20-30, Tech-savvy creatives, Electronic music fans",
    gender_distribution: { male: 65, female: 32, other: 3 },
    primary_location: "Seattle, WA, USA",
    behavioral_highlights: [
      "Early adopter of new music tech and platforms",
      "Creates and shares DJ mixes and remixes",
      "High engagement with NFTs and Web3 projects",
      "Active in gaming and streaming communities"
    ],
    personal_message: "Bridging music and technology to create immersive experiences. Seeking innovative partners who embrace the future of music and community.",
    ethos: {
      stands_for: ["Innovation", "Decentralization", "Artist ownership", "Creative experimentation", "Tech empowerment"],
      avoids: ["Traditional gatekeepers", "Copyright exploitation", "Closed ecosystems", "Anti-innovation attitudes"]
    }
  },
  {
    id: "5",
    name: "Zara Williams",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    portal_followers: 71200,
    social_followers: 342000,
    core_demographic: "Ages 16-25, Gen Z trendsetters, Pop and indie music fans",
    gender_distribution: { male: 28, female: 68, other: 4 },
    primary_location: "New York, NY, USA",
    behavioral_highlights: [
      "Viral content creator with high share rate",
      "Fashion and music crossover appeal",
      "Strong influence on emerging trends",
      "Premium merch collector and advocate"
    ],
    personal_message: "Curating the soundtrack for the next generation. Looking for collaborators who aren't afraid to break the mold and create something truly unique.",
    ethos: {
      stands_for: ["Self-expression", "LGBTQ+ rights", "Environmental activism", "Genre-blending", "Youth empowerment"],
      avoids: ["Cookie-cutter content", "Ageism", "Environmental harm", "Performative activism"]
    }
  },
  {
    id: "6",
    name: "Jordan Mitchell",
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
    portal_followers: 55800,
    social_followers: 178000,
    core_demographic: "Ages 30-45, Music collectors, Vinyl and vintage enthusiasts",
    gender_distribution: { male: 72, female: 26, other: 2 },
    primary_location: "Austin, TX, USA",
    behavioral_highlights: [
      "High-value purchases on limited editions",
      "Deep knowledge of music history and genres",
      "Active in record collecting communities",
      "Hosts listening parties and music discussions"
    ],
    personal_message: "Preserving music heritage while supporting contemporary artists. Interested in partnerships that honor the craft and history of music.",
    ethos: {
      stands_for: ["Musical craftsmanship", "Artistic integrity", "Music education", "Analog appreciation", "Long-form content"],
      avoids: ["Disposable content", "Algorithmic manipulation", "Quantity over quality", "Disrespect for music history"]
    }
  }
];

export function DiscoverPortals() {
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);

  const handleSubmitOffer = (portal: Portal) => {
    setSelectedPortal(portal);
    setOfferDialogOpen(true);
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_PORTALS.map((portal) => (
          <Card key={portal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-4">
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16 border-2 border-primary/20">
                  <AvatarImage src={portal.avatar_url} alt={portal.name} />
                  <AvatarFallback>{portal.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{portal.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{(portal.portal_followers / 1000).toFixed(1)}K</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{(portal.social_followers / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Demographics */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{portal.core_demographic}</p>
                
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{portal.primary_location}</span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    ♂ {portal.gender_distribution.male}%
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    ♀ {portal.gender_distribution.female}%
                  </Badge>
                  {portal.gender_distribution.other > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      ⚥ {portal.gender_distribution.other}%
                    </Badge>
                  )}
                </div>
              </div>

              {/* Behavioral Highlights */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Behavioral Highlights</h4>
                <ul className="space-y-1">
                  {portal.behavioral_highlights.slice(0, 3).map((highlight, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Personal Message */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">About</h4>
                <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                  {portal.personal_message}
                </p>
              </div>

              {/* Ethos Card */}
              <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold">What I Stand For</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {portal.ethos.stands_for.slice(0, 4).map((value, idx) => (
                      <Badge key={idx} variant="default" className="text-xs">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold">What I Avoid</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {portal.ethos.avoids.slice(0, 3).map((value, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Offer Button */}
              <Button 
                className="w-full" 
                onClick={() => handleSubmitOffer(portal)}
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Partnership Offer
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPortal && (
        <PartnershipOfferDialog
          open={offerDialogOpen}
          onOpenChange={setOfferDialogOpen}
          targetPortal={selectedPortal}
        />
      )}
    </>
  );
}
