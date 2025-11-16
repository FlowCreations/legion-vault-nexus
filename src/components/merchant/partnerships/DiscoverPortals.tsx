import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Users, MapPin, TrendingUp, TrendingDown, Send, Search, Eye } from "lucide-react";
import { PartnershipOfferDialog } from "./PartnershipOfferDialog";

interface Portal {
  id: string;
  name: string;
  avatar_url: string;
  portal_followers: number;
  social_followers: number;
  growth_trend: number; // percentage, positive or negative
  core_demographic: string;
  location: string;
  country: string;
  industry: string;
  tags: string[];
  // Extended data (for detail view only)
  gender_distribution: {
    male: number;
    female: number;
    other: number;
  };
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
    growth_trend: 12,
    core_demographic: "Ages 25-34, Urban professionals",
    location: "Los Angeles, CA",
    country: "United States",
    industry: "Wellness",
    tags: ["Mindfulness", "Lifestyle", "Creative", "Fitness"],
    gender_distribution: { male: 35, female: 62, other: 3 },
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
    growth_trend: 18,
    core_demographic: "Ages 18-28, College students",
    location: "Atlanta, GA",
    country: "United States",
    industry: "Music",
    tags: ["Hip-hop", "Underground", "Urban Culture", "R&B"],
    gender_distribution: { male: 58, female: 40, other: 2 },
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
    growth_trend: -5,
    core_demographic: "Ages 22-35, Latin music lovers",
    location: "Miami, FL",
    country: "United States",
    industry: "Music",
    tags: ["Latin", "Reggaeton", "Festival", "Dance"],
    gender_distribution: { male: 42, female: 56, other: 2 },
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
    growth_trend: 25,
    core_demographic: "Ages 20-30, Tech-savvy creatives",
    location: "Seattle, WA",
    country: "United States",
    industry: "Tech",
    tags: ["Web3", "NFTs", "Electronic Music", "Gaming"],
    gender_distribution: { male: 65, female: 32, other: 3 },
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
    growth_trend: 8,
    core_demographic: "Ages 16-25, Gen Z trendsetters",
    location: "New York, NY",
    country: "United States",
    industry: "Fashion",
    tags: ["Pop Culture", "Indie", "LGBTQ+", "Activism"],
    gender_distribution: { male: 28, female: 68, other: 4 },
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
    growth_trend: 3,
    core_demographic: "Ages 30-45, Music collectors",
    location: "Austin, TX",
    country: "United States",
    industry: "Music",
    tags: ["Vinyl", "Classic Rock", "Jazz", "Audiophile"],
    gender_distribution: { male: 72, female: 26, other: 2 },
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

const INDUSTRIES = ["All", "Music", "Sports", "Fashion", "Tech", "Wellness", "Gaming", "Food & Beverage", "Travel", "Lifestyle", "Business", "Other"];
const COUNTRIES = ["All", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Spain", "Italy", "Japan", "Brazil", "Mexico", "Other"];
const FOLLOWER_RANGES = [
  { label: "All", min: 0, max: Infinity },
  { label: "Under 10K", min: 0, max: 10000 },
  { label: "10K-50K", min: 10000, max: 50000 },
  { label: "50K-100K", min: 50000, max: 100000 },
  { label: "100K-500K", min: 100000, max: 500000 },
  { label: "500K+", min: 500000, max: Infinity },
];
const GROWTH_TRENDS = [
  { label: "All", filter: () => true },
  { label: "Growing", filter: (trend: number) => trend > 5 },
  { label: "Stable", filter: (trend: number) => trend >= -5 && trend <= 5 },
  { label: "Declining", filter: (trend: number) => trend < -5 },
];

export function DiscoverPortals() {
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [viewingPortal, setViewingPortal] = useState<Portal | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [countryFilter, setCountryFilter] = useState("All");
  const [followerRangeFilter, setFollowerRangeFilter] = useState("All");
  const [growthTrendFilter, setGrowthTrendFilter] = useState("All");

  const handleSubmitOffer = (portal: Portal) => {
    setSelectedPortal(portal);
    setOfferDialogOpen(true);
  };

  const handleViewDetails = (portal: Portal) => {
    setViewingPortal(portal);
    setDetailDrawerOpen(true);
  };

  const filteredPortals = MOCK_PORTALS.filter((portal) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      portal.name.toLowerCase().includes(searchLower) ||
      portal.industry.toLowerCase().includes(searchLower) ||
      portal.location.toLowerCase().includes(searchLower) ||
      portal.tags.some(tag => tag.toLowerCase().includes(searchLower));

    // Industry filter
    const matchesIndustry = industryFilter === "All" || portal.industry === industryFilter;

    // Country filter
    const matchesCountry = countryFilter === "All" || portal.country === countryFilter;

    // Follower range filter
    const selectedRange = FOLLOWER_RANGES.find(r => r.label === followerRangeFilter);
    const matchesFollowerRange = !selectedRange || followerRangeFilter === "All" ||
      (portal.portal_followers >= selectedRange.min && portal.portal_followers < selectedRange.max);

    // Growth trend filter
    const selectedTrend = GROWTH_TRENDS.find(t => t.label === growthTrendFilter);
    const matchesGrowthTrend = !selectedTrend || growthTrendFilter === "All" ||
      selectedTrend.filter(portal.growth_trend);

    return matchesSearch && matchesIndustry && matchesCountry && matchesFollowerRange && matchesGrowthTrend;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, industry, location, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={followerRangeFilter} onValueChange={setFollowerRangeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Followers" />
            </SelectTrigger>
            <SelectContent>
              {FOLLOWER_RANGES.map((range) => (
                <SelectItem key={range.label} value={range.label}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={growthTrendFilter} onValueChange={setGrowthTrendFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Growth" />
            </SelectTrigger>
            <SelectContent>
              {GROWTH_TRENDS.map((trend) => (
                <SelectItem key={trend.label} value={trend.label}>
                  {trend.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Portal Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPortals.map((portal) => (
          <Card key={portal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-5 space-y-4">
              {/* Profile Header */}
              <div className="flex items-start gap-3">
                <Avatar className="w-14 h-14 border-2 border-primary/20">
                  <AvatarImage src={portal.avatar_url} alt={portal.name} />
                  <AvatarFallback>{portal.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate">{portal.name}</h3>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {portal.industry}
                  </Badge>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs">Members</span>
                  </div>
                  <p className="font-semibold">{formatNumber(portal.portal_followers)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-xs">Social Reach</span>
                  </div>
                  <p className="font-semibold">{formatNumber(portal.social_followers)}</p>
                </div>
              </div>

              {/* Growth Trend */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">30-day trend:</span>
                <div className={`flex items-center gap-1 font-semibold text-sm ${
                  portal.growth_trend > 0 ? 'text-green-600' : portal.growth_trend < 0 ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {portal.growth_trend > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : portal.growth_trend < 0 ? (
                    <TrendingDown className="w-3.5 h-3.5" />
                  ) : null}
                  <span>{portal.growth_trend > 0 ? '+' : ''}{portal.growth_trend}%</span>
                </div>
              </div>

              {/* Demographics & Location */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{portal.core_demographic}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{portal.location}</span>
                </div>
              </div>

              {/* Keyword Tags */}
              <div className="flex flex-wrap gap-1.5">
                {portal.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline"
                  onClick={() => handleViewDetails(portal)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                <Button 
                  onClick={() => handleSubmitOffer(portal)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Offer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPortals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No portals found matching your criteria</p>
        </div>
      )}

      {/* Detail Drawer */}
      <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {viewingPortal && (
            <>
              <SheetHeader>
                <SheetTitle className="sr-only">Portal Details</SheetTitle>
                {/* Profile Header */}
                <div className="flex items-start gap-4 pb-4">
                  <Avatar className="w-20 h-20 border-2 border-primary/20">
                    <AvatarImage src={viewingPortal.avatar_url} alt={viewingPortal.name} />
                    <AvatarFallback>{viewingPortal.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-2xl">{viewingPortal.name}</h2>
                    <Badge variant="secondary" className="mt-2">
                      {viewingPortal.industry}
                    </Badge>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Portal Members</span>
                    </div>
                    <p className="text-2xl font-semibold">{formatNumber(viewingPortal.portal_followers)}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Social Reach</span>
                    </div>
                    <p className="text-2xl font-semibold">{formatNumber(viewingPortal.social_followers)}</p>
                  </div>
                </div>

                {/* Growth Trend */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">30-Day Growth Trend</span>
                    <div className={`flex items-center gap-2 font-semibold text-lg ${
                      viewingPortal.growth_trend > 0 ? 'text-green-600' : viewingPortal.growth_trend < 0 ? 'text-red-600' : 'text-muted-foreground'
                    }`}>
                      {viewingPortal.growth_trend > 0 ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : viewingPortal.growth_trend < 0 ? (
                        <TrendingDown className="w-5 h-5" />
                      ) : null}
                      <span>{viewingPortal.growth_trend > 0 ? '+' : ''}{viewingPortal.growth_trend}%</span>
                    </div>
                  </div>
                </div>

                {/* Demographics */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">Demographics</h3>
                  <p className="text-sm">{viewingPortal.core_demographic}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{viewingPortal.location}</span>
                  </div>
                </div>

                {/* Gender Distribution */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">Gender Distribution</h3>
                  <div className="flex gap-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      ♂ Male: {viewingPortal.gender_distribution.male}%
                    </Badge>
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      ♀ Female: {viewingPortal.gender_distribution.female}%
                    </Badge>
                    {viewingPortal.gender_distribution.other > 0 && (
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        ⚥ Other: {viewingPortal.gender_distribution.other}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Keywords */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingPortal.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* About */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">About</h3>
                  <p className="text-sm leading-relaxed">{viewingPortal.personal_message}</p>
                </div>

                {/* Behavioral Highlights */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground">Behavioral Highlights</h3>
                  <ul className="space-y-2">
                    {viewingPortal.behavioral_highlights.map((highlight, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Ethos Card */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">What I Stand For</h3>
                    <div className="flex flex-wrap gap-2">
                      {viewingPortal.ethos.stands_for.map((value, idx) => (
                        <Badge key={idx} variant="default">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">What I Avoid</h3>
                    <div className="flex flex-wrap gap-2">
                      {viewingPortal.ethos.avoids.map((value, idx) => (
                        <Badge key={idx} variant="outline">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit Offer Button */}
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    setDetailDrawerOpen(false);
                    handleSubmitOffer(viewingPortal);
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Partnership Offer
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

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
