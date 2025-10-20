import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Target, TrendingUp, Calendar, DollarSign, Edit2, Rocket } from "lucide-react";

interface CampaignSuggestion {
  title: string;
  description: string;
  targetAudience: string;
  expectedROI: string;
  timeline: string;
}

export const CreateCampaigns = () => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CampaignSuggestion[]>([]);
  const [campaignGoal, setCampaignGoal] = useState("");
  const [editingCampaign, setEditingCampaign] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<CampaignSuggestion | null>(null);
  const { toast } = useToast();

  const generateCampaigns = async () => {
    setLoading(true);
    
    // Detect campaign type from goal input
    const goalLower = campaignGoal.toLowerCase();
    let campaignType = 'general';
    
    if (goalLower.includes('album') || goalLower.includes('music') || goalLower.includes('stream')) {
      campaignType = Math.random() > 0.5 ? 'album1' : 'album2';
    } else if (goalLower.includes('merch') || goalLower.includes('product') || goalLower.includes('apparel')) {
      campaignType = Math.random() > 0.5 ? 'merch1' : 'merch2';
    } else if (goalLower.includes('community') || goalLower.includes('engagement') || goalLower.includes('fan')) {
      campaignType = Math.random() > 0.5 ? 'community1' : 'community2';
    } else {
      // Random selection for general requests
      const types = ['album1', 'album2', 'merch1', 'merch2', 'community1', 'community2', 'retention', 'conversion'];
      campaignType = types[Math.floor(Math.random() * types.length)];
    }
    
    const campaignLibrary: Record<string, CampaignSuggestion[]> = {
      album1: [
        {
          title: "In The Air Tonight Album Push",
          description: "Capitalize on the momentum of your top-performing track (+12% growth). Launch a targeted campaign promoting the full 'Power' album to fans who've streamed 'In The Air Tonight' 3+ times. Bundle with exclusive behind-the-scenes content and acoustic versions.",
          targetAudience: "Super fans and repeat listeners in Nashville, Austin, and Atlanta (3,420+ engaged users)",
          expectedROI: "3.5x - Based on current 18.5% stream share and high album completion rate",
          timeline: "2-week sprint campaign with weekend peak push"
        },
        {
          title: "Fire Starter Discovery Bundle",
          description: "Your second-highest track (198K streams, 15.7%) attracts new listeners. Create a 'discovery playlist' featuring Fire Starter + album deep cuts. Partner with Spotify/Apple for playlist placement targeting fans of similar artists.",
          targetAudience: "New listeners and playlist followers (estimated 45K monthly discoverers)",
          expectedROI: "2.9x - New listener conversion to full album streams",
          timeline: "30-day sustained playlist campaign"
        },
        {
          title: "Strange & Power Revival Campaign",
          description: "Strange is growing (+5%) while Power is declining (-2%). Create a 'contrast campaign' highlighting the evolution between these tracks. Bundle them as a 'sonic journey' with special artwork and liner notes.",
          targetAudience: "Engaged fans who've streamed both tracks (142K+ combined streams)",
          expectedROI: "3.2x - Re-engage declining Power listeners with Strange momentum",
          timeline: "3-week narrative-driven campaign"
        }
      ],
      album2: [
        {
          title: "Carolina Geographic Targeting",
          description: "With 142K streams and +3% growth, Carolina resonates strongly in the South. Create location-based campaigns in Carolina markets, partner with local radio, and create regional exclusive album bundles.",
          targetAudience: "Listeners in NC/SC regions plus Nashville/Atlanta markets (est. 6,000 fans)",
          expectedROI: "3.1x - Geographic targeting with strong cultural resonance",
          timeline: "4-week regional domination campaign"
        },
        {
          title: "Full Album Streaming Challenge",
          description: "Challenge fans to stream the entire album for chances to win signed copies and VIP experiences. Leverage your 234K+ engaged streamers (from top track) to drive full album plays.",
          targetAudience: "Active streamers with 5+ plays on any single track (est. 12K users)",
          expectedROI: "2.7x - Gamification drives repeat plays and social sharing",
          timeline: "2-week challenge with weekly prizes"
        },
        {
          title: "UFC/ESPN Partnership Album Promo",
          description: "Leverage your brand partnerships to feature album tracks in UFC highlights and ESPN content. Create co-branded playlists and exclusive athlete endorsements.",
          targetAudience: "Sports fans and crossover audience (UFC/ESPN viewers, est. 500K reach)",
          expectedROI: "4.5x - High-value brand partnership amplification",
          timeline: "6-week partnership integration campaign"
        }
      ],
      merch1: [
        {
          title: "NY Collection Momentum Push",
          description: "Your NY merch line is performing well. Launch a limited 'Series 2' with new colorways and designs. Create urgency with numbered editions (1-500) and bundle with album downloads.",
          targetAudience: "Previous NY collection buyers + super fans (847 super fans, 200+ past buyers)",
          expectedROI: "4.8x - Premium pricing on limited editions, proven product-market fit",
          timeline: "2-week flash drop campaign"
        },
        {
          title: "Geographic Merch Strategy",
          description: "Create location-specific merch for top markets: Nashville, Austin, Atlanta designs. Partner with local venues for exclusive drops. Use regional pride to drive sales.",
          targetAudience: "Fans in top 5 cities (Nashville 3,420, Austin 2,890, Atlanta 2,560, LA 2,210, NY 1,980)",
          expectedROI: "3.6x - Local pride premium + venue partnership commission",
          timeline: "8-week rolling city-by-city launch"
        },
        {
          title: "Super Fan Exclusive Merch Club",
          description: "Launch 'Legion Elite' - monthly merch drops exclusively for your 847 super fans. Limited runs, early access, members-only designs. Subscription model: $25/month for guaranteed exclusive item.",
          targetAudience: "Super fans (847 identified) with proven purchase history",
          expectedROI: "5.2x - Subscription revenue + upsell opportunities",
          timeline: "3-month pilot program"
        }
      ],
      merch2: [
        {
          title: "Track-Inspired Merch Line",
          description: "Create merch collections inspired by top tracks: 'In The Air Tonight' premium line, 'Fire Starter' streetwear, etc. Each track's aesthetic translated to apparel. Cross-promote during streams.",
          targetAudience: "Fans of specific tracks (234K+ top track listeners)",
          expectedROI: "3.9x - Emotional connection to favorite tracks drives purchases",
          timeline: "4-week coordinated launch with track promotion"
        },
        {
          title: "Concert Merch Pre-Order Campaign",
          description: "Before tour announcement, offer pre-order merch with guaranteed venue pickup. Create FOMO with 'tour exclusive' designs. Bundle with ticket pre-sale codes.",
          targetAudience: "Fans in tour cities (top 5 markets, 13,060 combined fans)",
          expectedROI: "4.1x - Pre-payment reduces risk, tour exclusivity premium",
          timeline: "6-week pre-tour campaign"
        },
        {
          title: "Collaborative Artist Merch",
          description: "Partner with local artists in Nashville/Austin for limited co-designed merch. Tap into their followings and create cross-promotional bundles.",
          targetAudience: "Your fans + partner artist fans (est. combined 50K+ reach)",
          expectedROI: "3.4x - Shared marketing costs, expanded audience",
          timeline: "5-week collaborative launch"
        }
      ],
      community1: [
        {
          title: "Super Fan Ambassador Program",
          description: "Empower your 847 super fans as brand ambassadors. Give them exclusive content to share, referral codes with rewards, and behind-the-scenes access. Gamify with leaderboards.",
          targetAudience: "Super fans (847) with proven engagement and advocacy potential",
          expectedROI: "3.8x - Word-of-mouth growth + increased super fan spend",
          timeline: "12-week program with monthly challenges"
        },
        {
          title: "Community Content Creation Contest",
          description: "Challenge fans to create content: covers, remixes, artwork, videos featuring your music. Feature winners on socials and website. Prize: studio session or meet & greet.",
          targetAudience: "Creative fans and content creators (est. 2,000+ engaged users)",
          expectedROI: "2.5x - UGC amplifies reach, authentic engagement",
          timeline: "4-week contest with 2-week voting period"
        },
        {
          title: "Local Legion Meetups",
          description: "Host fan meetups in your top 5 cities. Intimate acoustic sessions, Q&As, exclusive merch. Build local communities that drive ongoing engagement and ticket sales.",
          targetAudience: "Local fans in Nashville (3,420), Austin (2,890), Atlanta (2,560), LA (2,210), NY (1,980)",
          expectedROI: "3.1x - Deepens loyalty, drives merch + future ticket sales",
          timeline: "3-month tour of meetups"
        }
      ],
      community2: [
        {
          title: "Interactive Listening Party Series",
          description: "Host monthly virtual listening parties for new tracks/albums. Real-time chat, artist commentary, exclusive previews. Build anticipation and community around releases.",
          targetAudience: "Engaged streamers (12K+ who listen to multiple tracks)",
          expectedROI: "2.3x - Increased streams + community building drives long-term value",
          timeline: "6-month monthly series"
        },
        {
          title: "Fan Influence Campaign",
          description: "Let fans vote on next single, merch designs, setlist songs. Create polls, surveys, and interactive decisions. Give ownership and deepen investment.",
          targetAudience: "All fans (20K+ total engaged users)",
          expectedROI: "2.8x - Increased engagement drives streams and purchases",
          timeline: "Ongoing quarterly decisions"
        },
        {
          title: "Behind-the-Scenes Content Series",
          description: "Weekly BTS content: studio sessions, songwriting process, tour prep. Create 'Legion Insider' tier on social media with exclusive access. Drive social follows and engagement.",
          targetAudience: "Social media followers and engaged fans (est. 15K+ active)",
          expectedROI: "2.1x - Social growth drives discoverability and sales",
          timeline: "8-week content series"
        }
      ],
      retention: [
        {
          title: "Re-Engagement Power Campaign",
          description: "Your 'Power' track is declining (-2%). Target previous listeners with 'rediscover' campaign: acoustic version, remixes, music video. Win back lapsed fans.",
          targetAudience: "Previous Power listeners who haven't streamed in 30+ days (est. 8K users)",
          expectedROI: "2.6x - Win back declining segment prevents further erosion",
          timeline: "3-week re-engagement blitz"
        },
        {
          title: "Loyalty Rewards Program",
          description: "Reward repeat listeners and buyers with points system. Points = exclusive content, merch discounts, VIP upgrades. Incentivize continued engagement.",
          targetAudience: "Repeat visitors and buyers (est. 5K+ loyal users)",
          expectedROI: "3.7x - Increased customer lifetime value",
          timeline: "Ongoing program with quarterly rewards"
        },
        {
          title: "Personalized Fan Journey Emails",
          description: "Automated email series based on behavior: welcome new fans, celebrate milestones (100 streams!), re-engage dormant fans. Personalized recommendations.",
          targetAudience: "Email subscribers (capture from all campaigns, est. 10K)",
          expectedROI: "3.3x - Automated nurture increases LTV",
          timeline: "2-week setup, ongoing automation"
        }
      ],
      conversion: [
        {
          title: "First-Time Buyer Flash Sale",
          description: "Target engaged listeners who haven't purchased yet (12K+ streamers). 48-hour flash sale: 30% off first purchase + free shipping. Limited-time urgency.",
          targetAudience: "Engaged non-buyers (est. 10K users with 3+ streams, $0 spent)",
          expectedROI: "3.9x - Convert warm audience to paying customers",
          timeline: "48-hour flash campaign"
        },
        {
          title: "Bundle & Save Strategy",
          description: "Create irresistible bundles: Album + T-shirt, Vinyl + Signed Poster, Full Discography + Exclusive Merch. Higher value perception drives conversion.",
          targetAudience: "All engaged fans, especially high-intent browsers",
          expectedROI: "4.3x - Higher AOV on bundles vs individual items",
          timeline: "4-week bundle promotion"
        },
        {
          title: "Countdown to Tour Conversion",
          description: "Create urgency countdown to tour announcement. Each day reveals a new perk for early ticket buyers: merch discount, VIP upgrade chance, meet & greet entry.",
          targetAudience: "Fans in tour markets (13,060 in top 5 cities)",
          expectedROI: "4.6x - Tour tickets + merch + FOMO premium",
          timeline: "7-day countdown campaign"
        }
      ]
    };

    const selectedCampaigns = campaignLibrary[campaignType] || campaignLibrary.conversion;

    // Simulate loading
    setTimeout(() => {
      setSuggestions(selectedCampaigns);
      setLoading(false);
      toast({
        title: "Campaign Suggestions Generated",
        description: `${campaignType.includes('album') ? 'Album sales' : campaignType.includes('merch') ? 'Merch revenue' : campaignType.includes('community') ? 'Community engagement' : 'Conversion'} strategy based on your analytics`
      });
    }, 1500);
  };

  const handleEditCampaign = (index: number, campaign: CampaignSuggestion) => {
    setEditingCampaign(index);
    setEditedContent(campaign);
  };

  const handleSaveEdit = (index: number) => {
    if (editedContent) {
      const updatedSuggestions = [...suggestions];
      updatedSuggestions[index] = editedContent;
      setSuggestions(updatedSuggestions);
      setEditingCampaign(null);
      setEditedContent(null);
      toast({
        title: "Campaign Updated",
        description: "Your changes have been saved."
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCampaign(null);
    setEditedContent(null);
  };

  const handleBuildCampaign = () => {
    toast({
      title: "Campaign Build Started",
      description: "Your campaigns are being set up. You'll be notified when ready."
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">AI Campaign Generator</h2>
        <p className="text-muted-foreground">
          Get personalized campaign suggestions based on your user behavior data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Campaign Goal (Optional)
          </CardTitle>
          <CardDescription>
            Specify what you want to achieve, or leave blank for general suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="goal">Campaign Objective</Label>
            <Input
              id="goal"
              placeholder="e.g., Increase album sales, Drive merch revenue, Boost community engagement"
              value={campaignGoal}
              onChange={(e) => setCampaignGoal(e.target.value)}
            />
          </div>
          <Button 
            onClick={generateCampaigns} 
            disabled={loading}
            className="w-full bg-gradient-gold"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Generating Campaigns...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate AI Campaign Suggestions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <div className="grid gap-6">
          {suggestions.map((suggestion, index) => (
            <Card key={index} className="border-2 border-yellow-500/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-yellow-500" />
                    {editingCampaign === index ? (
                      <Input
                        value={editedContent?.title || ''}
                        onChange={(e) => setEditedContent({ ...editedContent!, title: e.target.value })}
                        className="text-lg font-semibold"
                      />
                    ) : (
                      suggestion.title
                    )}
                  </div>
                  {editingCampaign === index ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit(index)}>Save</Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditCampaign(index, suggestion)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingCampaign === index ? (
                  <Textarea
                    value={editedContent?.description || ''}
                    onChange={(e) => setEditedContent({ ...editedContent!, description: e.target.value })}
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-foreground/80">{suggestion.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Target Audience</p>
                      {editingCampaign === index ? (
                        <Input
                          value={editedContent?.targetAudience || ''}
                          onChange={(e) => setEditedContent({ ...editedContent!, targetAudience: e.target.value })}
                          className="text-sm mt-1"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{suggestion.targetAudience}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Expected ROI</p>
                      {editingCampaign === index ? (
                        <Input
                          value={editedContent?.expectedROI || ''}
                          onChange={(e) => setEditedContent({ ...editedContent!, expectedROI: e.target.value })}
                          className="text-sm mt-1"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{suggestion.expectedROI}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Timeline</p>
                      {editingCampaign === index ? (
                        <Input
                          value={editedContent?.timeline || ''}
                          onChange={(e) => setEditedContent({ ...editedContent!, timeline: e.target.value })}
                          className="text-sm mt-1"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{suggestion.timeline}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button 
            onClick={handleBuildCampaign}
            className="w-full bg-gradient-gold"
            size="lg"
          >
            <Rocket className="mr-2 h-5 w-5" />
            Build Campaign
          </Button>
        </div>
      )}
    </div>
  );
};
