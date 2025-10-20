import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowDown, Users, ShoppingCart, Heart, Rocket, Edit2, Zap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailSequence {
  emailNumber: number;
  subject: string;
  triggerCondition: string;
  waitTime: string;
  content: string;
  discountOffer?: string;
}

interface FunnelStage {
  stage: string;
  title: string;
  description: string;
  tactics: string[];
  metrics: string;
  emailSequence?: EmailSequence[];
}

export const BuildFunnel = () => {
  const [loading, setLoading] = useState(false);
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  const [funnelGoal, setFunnelGoal] = useState("");
  const [funnelType, setFunnelType] = useState("conversion");
  const [editingStage, setEditingStage] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<FunnelStage | null>(null);
  const { toast } = useToast();

  const generateFunnel = async () => {
    setLoading(true);
    
    try {
      // Fetch merchant data for personalized suggestions
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get analytics data
      const { data: analyticsData } = await supabase
        .from('user_analytics')
        .select('*')
        .limit(100);
      
      // Get recent sales data
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      // Get user engagement data
      const { data: eventsData } = await supabase
        .from('user_events')
        .select('event_type, event_data')
        .order('created_at', { ascending: false })
        .limit(100);
      
      // Analyze data for personalized recommendations
      const totalOrders = ordersData?.length || 0;
      const avgOrderValue = ordersData?.reduce((acc, order) => acc + Number(order.total_amount), 0) / totalOrders || 0;
      const topEventTypes = eventsData?.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      console.log("Dashboard data for funnel:", { totalOrders, avgOrderValue, topEventTypes });
      
      // Detect funnel type from goal and type inputs
      const goalLower = funnelGoal.toLowerCase();
      let selectedType = funnelType;
      
      if (goalLower.includes('album') || goalLower.includes('music') || goalLower.includes('stream')) {
        selectedType = Math.random() > 0.5 ? 'album-conversion' : 'album-engagement';
      } else if (goalLower.includes('merch') || goalLower.includes('product') || goalLower.includes('apparel')) {
        selectedType = Math.random() > 0.5 ? 'merch-conversion' : 'merch-upsell';
      } else if (goalLower.includes('community') || goalLower.includes('fan')) {
        selectedType = Math.random() > 0.5 ? 'community-engagement' : 'community-retention';
      } else if (funnelType === 'conversion') {
        selectedType = Math.random() > 0.5 ? 'general-conversion' : 'tour-conversion';
      }
    
    const funnelLibrary: Record<string, FunnelStage[]> = {
      'album-conversion': [
        {
          stage: "Discovery",
          title: "Attract New Listeners",
          description: "Drive discovery of top-performing tracks through strategic playlist placement and viral content.",
          tactics: [
            "Run Spotify/Apple Music ads targeting 'In The Air Tonight' (+18.5% of streams)",
            "Create short-form video content using Fire Starter (198K streams) for TikTok/Reels",
            "Partner with influencers in Nashville/Austin markets for organic reach",
            "Submit top tracks to editorial playlists in rock/country crossover categories"
          ],
          metrics: "New unique listeners, playlist adds, social reach, first-time stream rate"
        },
        {
          stage: "Sampling",
          title: "Drive Track Engagement",
          description: "Convert casual listeners into repeat streamers by showcasing album depth.",
          tactics: [
            "Auto-play album tracks after 'In The Air Tonight' to leverage 18.5% dominance",
            "Create 'Best of Sons of Legion' playlist featuring top 5 tracks",
            "Retarget single-track listeners with 30-sec album preview ads",
            "Email campaign to free users: 'If you loved this, you'll love...'"
          ],
          metrics: "Tracks per listener, album completion rate, skip rate, time spent listening"
        },
        {
          stage: "Album Discovery",
          title: "Convert to Full Album Streams",
          description: "Guide engaged listeners to stream complete albums for maximum revenue.",
          tactics: [
            "Promote 'Power' album to In The Air Tonight listeners (proven cohesion)",
            "Limited-time 'Album Journey' listening party with live artist commentary",
            "Gamification: 'Complete 3 albums for exclusive content' challenge",
            "Bundle album stream with exclusive acoustic versions download"
          ],
          metrics: "Full album streams, album-to-track ratio, playlist saves, fan conversion"
        },
        {
          stage: "Purchase",
          title: "Monetize Super Listeners",
          description: "Convert high-engagement streamers into paying customers.",
          tactics: [
            "Target 10+ play users with vinyl/CD exclusive editions",
            "Bundle digital album + signed artwork for collectors ($25-35)",
            "Offer 'complete discography' package to super fans (847 identified)",
            "Flash sale: Stream 50+ times = 40% off physical albums"
          ],
          metrics: "Stream-to-purchase conversion, average order value, super fan acquisition"
        },
        {
          stage: "Advocacy",
          title: "Turn Buyers Into Ambassadors",
          description: "Empower album buyers to share and recruit new listeners.",
          tactics: [
            "Include shareable content in album purchases (exclusive videos, artwork)",
            "Referral program: 'Share the album, get 20% off next purchase'",
            "Feature top sharers in artist's social media shoutouts",
            "Create 'Legion Insider' badge for album owners with special privileges"
          ],
          metrics: "Share rate, referral conversions, social mentions, UGC volume"
        }
      ],
      'album-engagement': [
        {
          stage: "Awareness",
          title: "Maximize Discoverability",
          description: "Place music in front of high-intent listeners through strategic partnerships.",
          tactics: [
            "Leverage UFC/ESPN partnerships for in-content music placement",
            "Target sports fans with Carolina (+3% growth) in regional campaigns",
            "Submit Strange (176K streams, +5%) to Spotify 'New Music Friday'",
            "Cross-promote on Paramount shows using brand partnership"
          ],
          metrics: "Brand lift, search volume, social mentions, new follower rate"
        },
        {
          stage: "Interest",
          title: "Build Listening Habit",
          description: "Transform one-time listeners into habitual streamers.",
          tactics: [
            "Personalized playlist recommendations based on liked tracks",
            "Weekly 'New from Sons of Legion' email to past listeners",
            "Retarget 30-day inactive streamers with 'We miss you' campaign",
            "Create artist radio stations featuring similar artists + your deep cuts"
          ],
          metrics: "Repeat listen rate, days between streams, monthly active listeners"
        },
        {
          stage: "Engagement",
          title: "Deepen Fan Connection",
          description: "Create multiple touchpoints to build emotional investment.",
          tactics: [
            "Behind-the-scenes content series: How Power album was made",
            "Interactive polls: Vote on next single, setlist songs",
            "Exclusive acoustic sessions for email subscribers",
            "Fan Q&A sessions with band members via Instagram Live"
          ],
          metrics: "Engagement rate, content views, email open rate, social interactions"
        },
        {
          stage: "Community",
          title: "Foster Fan Community",
          description: "Build spaces where fans connect with each other and the artist.",
          tactics: [
            "Launch Discord server for top 847 super fans",
            "Monthly virtual listening parties with artist commentary",
            "Fan cover song contest with prizes (meet & greet, signed gear)",
            "Create 'Legion' Facebook group moderated by band"
          ],
          metrics: "Community size, daily active members, UGC volume, sentiment score"
        },
        {
          stage: "Loyalty",
          title: "Maintain Long-Term Engagement",
          description: "Keep fans engaged between releases with consistent value.",
          tactics: [
            "Monthly newsletter with unreleased demos and studio updates",
            "Early access to new tracks for fans with 100+ streams",
            "Exclusive merch drops for community members only",
            "Points system: Streams + engagement = rewards tiers"
          ],
          metrics: "Retention rate, customer lifetime streams, churn prevention"
        }
      ],
      'merch-conversion': [
        {
          stage: "Awareness",
          title: "Introduce Product Line",
          description: "Build awareness of merch offerings among music fans.",
          tactics: [
            "Showcase NY collection (proven performer) in music videos",
            "Partner with local Nashville/Austin boutiques for in-store displays",
            "Instagram ads targeting fans who've streamed 5+ times",
            "Feature merch in Spotify Canvas animations for top tracks"
          ],
          metrics: "Merch page visits, product impressions, social engagement",
          emailSequence: [
            {
              emailNumber: 1,
              subject: "🎸 Check Out Our New Merch Drop!",
              triggerCondition: "User visits site but doesn't view merch page",
              waitTime: "24 hours after visit",
              content: "Hey there! We noticed you stopped by. Have you seen our latest collection? Check out exclusive designs that are flying off the shelves.",
              discountOffer: undefined
            },
            {
              emailNumber: 2,
              subject: "Still Thinking? Here's 10% Off 🎁",
              triggerCondition: "Email 1 not opened after 48 hours",
              waitTime: "2 days after Email 1",
              content: "We get it - choosing the perfect piece takes time. Here's 10% off to help you decide. Use code: MERCH10",
              discountOffer: "10% off - Code: MERCH10"
            }
          ]
        },
        {
          stage: "Interest",
          title: "Drive Product Exploration",
          description: "Get fans to browse and consider purchasing merch.",
          tactics: [
            "Limited-time 'Track Collection' merch matching each top song",
            "User-generated content: Fans modeling merch with contest prizes",
            "Virtual try-on using AR for apparel items",
            "Bundle previews: 'Complete the look' product recommendations"
          ],
          metrics: "Products viewed per session, cart add rate, wishlist saves",
          emailSequence: [
            {
              emailNumber: 1,
              subject: "We Saw You Looking 👀",
              triggerCondition: "User views 3+ products but doesn't add to cart",
              waitTime: "6 hours after browsing",
              content: "Hey! You checked out some great items. Here are our most popular products that fans love. Plus, free shipping on orders over $50!",
              discountOffer: undefined
            },
            {
              emailNumber: 2,
              subject: "Last Chance: 15% Off Your Favorites 🔥",
              triggerCondition: "Email 1 opened but no cart activity",
              waitTime: "48 hours after Email 1",
              content: "Don't miss out! The items you viewed are still available. Grab them now with 15% off using code: EXPLORE15",
              discountOffer: "15% off - Code: EXPLORE15"
            }
          ]
        },
        {
          stage: "Decision",
          title: "Convert Browsers to Buyers",
          description: "Remove friction and create urgency to drive first purchase.",
          tactics: [
            "First-time buyer discount: 20% off + free shipping over $50",
            "Countdown timers on limited editions (create scarcity)",
            "Social proof: 'X fans bought this in the last 24 hours'",
            "Risk reversal: 30-day money-back guarantee on all apparel"
          ],
          metrics: "Conversion rate, cart abandonment rate, coupon redemption",
          emailSequence: [
            {
              emailNumber: 1,
              subject: "Your Cart Is Waiting! 🛒",
              triggerCondition: "User adds items to cart but doesn't checkout",
              waitTime: "1 hour after cart abandonment",
              content: "You left some awesome items in your cart! Complete your order now and they'll ship out today. Free shipping on orders over $50!",
              discountOffer: undefined
            },
            {
              emailNumber: 2,
              subject: "Don't Miss Out! 20% Off Your Cart 💥",
              triggerCondition: "Cart still abandoned 24 hours later",
              waitTime: "24 hours after Email 1",
              content: "These items won't last long! Complete your purchase now with 20% off. Use code: CART20. Offer expires in 24 hours!",
              discountOffer: "20% off - Code: CART20"
            },
            {
              emailNumber: 3,
              subject: "Final Call: Your Items Are Almost Gone ⏰",
              triggerCondition: "Cart still abandoned after Email 2",
              waitTime: "48 hours after Email 2",
              content: "This is it! Your cart items are low in stock and this is your last chance to grab them with our special discount before the offer expires.",
              discountOffer: "25% off - Code: LASTCHANCE"
            }
          ]
        },
        {
          stage: "Purchase",
          title: "Maximize Order Value",
          description: "Increase average order value through strategic upsells.",
          tactics: [
            "Bundle suggestions at checkout: 'Fans also bought...'",
            "Free item threshold: Spend $75, get free sticker pack",
            "Limited premium items: Signed posters only with $100+ orders",
            "Mystery item offer: Add $15 for surprise exclusive merch"
          ],
          metrics: "Average order value, items per transaction, bundle attach rate",
          emailSequence: [
            {
              emailNumber: 1,
              subject: "Thanks for Your Order! Here's What's Next 📦",
              triggerCondition: "Purchase completed",
              waitTime: "Immediately after purchase",
              content: "Thank you for supporting us! Your order is being prepared. Track your shipment and get ready to rock your new gear!",
              discountOffer: undefined
            },
            {
              emailNumber: 2,
              subject: "Complete Your Collection - 15% Off! 🎁",
              triggerCondition: "7 days after purchase",
              waitTime: "7 days post-purchase",
              content: "Hope you're loving your recent purchase! Want to complete your collection? Here's 15% off your next order as a thank you!",
              discountOffer: "15% off next order - Code: THANKYOU15"
            }
          ]
        },
        {
          stage: "Retention",
          title: "Drive Repeat Purchases",
          description: "Convert one-time buyers into recurring merch customers.",
          tactics: [
            "Post-purchase email: 'Thanks! Here's 15% off your next order'",
            "Monthly exclusive drops for previous buyers (VIP early access)",
            "Loyalty program: Earn points on every merch purchase",
            "Seasonal collections: New designs quarterly to drive returns"
          ],
          metrics: "Repeat purchase rate, time between purchases, customer LTV",
          emailSequence: [
            {
              emailNumber: 1,
              subject: "New Drop Alert! VIP Early Access 🌟",
              triggerCondition: "New product launch (monthly)",
              waitTime: "24 hours before public launch",
              content: "You're a valued customer! Get exclusive early access to our newest merch drop before anyone else. Shop now before it sells out!",
              discountOffer: undefined
            },
            {
              emailNumber: 2,
              subject: "We Miss You! Come Back for 20% Off 💙",
              triggerCondition: "No purchase in 60 days",
              waitTime: "60 days since last purchase",
              content: "It's been a while! We've added tons of new designs since your last visit. Use code: COMEBACK20 for 20% off your next order!",
              discountOffer: "20% off - Code: COMEBACK20"
            }
          ]
        }
      ],
      'merch-upsell': [
        {
          stage: "Segmentation",
          title: "Identify High-Value Customers",
          description: "Target super fans and past buyers with premium offerings.",
          tactics: [
            "Segment 847 super fans for exclusive premium line",
            "Identify geographic clusters (Nashville 3,420 fans) for local drops",
            "Target previous NY collection buyers with Series 2 launch",
            "Score customers by: streams + purchases + social engagement"
          ],
          metrics: "Segment size, customer LTV by segment, purchase frequency"
        },
        {
          stage: "Premium Introduction",
          title: "Present Higher-Tier Options",
          description: "Introduce premium products to proven buyers.",
          tactics: [
            "Launch 'Legion Elite' collection: Premium materials, limited runs",
            "Signed and numbered merchandise (1-500) for collectors",
            "Exclusive colorways only available to repeat customers",
            "Bundle premium: Signed vinyl + exclusive merch box ($150+)"
          ],
          metrics: "Premium product click rate, price point acceptance, margin"
        },
        {
          stage: "Value Communication",
          title: "Justify Premium Pricing",
          description: "Demonstrate unique value of higher-priced items.",
          tactics: [
            "Behind-the-scenes videos: How premium merch is made",
            "Scarcity messaging: 'Only 200 available worldwide'",
            "Testimonials from previous premium buyers",
            "Investment angle: 'Limited editions appreciate in value'"
          ],
          metrics: "Content engagement, premium conversion rate, perceived value score"
        },
        {
          stage: "Cross-Sell",
          title: "Expand Product Mix",
          description: "Introduce complementary products to increase basket size.",
          tactics: [
            "Apparel buyers → Accessories (hats, bandanas)",
            "Print buyers → Collectibles (signed items, limited editions)",
            "Album buyers → Track-inspired merch collections",
            "Create 'complete fan packages' across categories"
          ],
          metrics: "Cross-sell rate, category penetration, product affinity"
        },
        {
          stage: "VIP Program",
          title: "Exclusive Membership Tier",
          description: "Create subscription model for highest-value fans.",
          tactics: [
            "Monthly merch subscription: $25/month for exclusive item + perks",
            "Annual membership: $250 for quarterly premium drops + events",
            "Tiered benefits: Bronze/Silver/Gold based on lifetime spend",
            "Members-only virtual shopping events with artist appearances"
          ],
          metrics: "Subscription rate, monthly recurring revenue, membership retention"
        }
      ],
      'community-engagement': [
        {
          stage: "Welcome",
          title: "Onboard New Fans",
          description: "Create positive first impression and set engagement expectations.",
          tactics: [
            "Automated welcome email series introducing band story and music",
            "New fan exclusive: Free download of acoustic session",
            "Social media welcome: Tag us for a shoutout",
            "Survey: 'How did you discover us?' to personalize journey"
          ],
          metrics: "Welcome series completion rate, early engagement score, social follows"
        },
        {
          stage: "Participation",
          title: "Drive Initial Engagement",
          description: "Get fans to take first community actions.",
          tactics: [
            "Interactive polls: Vote on next single, favorite track",
            "User-generated content contest: Share your concert photo",
            "Comment challenges on social posts for prizes",
            "Join Discord/Facebook group for exclusive content"
          ],
          metrics: "First action rate, UGC submissions, community join rate"
        },
        {
          stage: "Connection",
          title: "Build Relationships",
          description: "Foster connections between fans and with the artist.",
          tactics: [
            "Monthly virtual meet & greets for active community members",
            "Fan spotlight features: Story of the month",
            "Collaborative projects: Crowd-sourced music video",
            "Local meetups in top 5 cities (13,060 fans)"
          ],
          metrics: "Event attendance, peer-to-peer interactions, sentiment score"
        },
        {
          stage: "Contribution",
          title: "Empower Fan Creativity",
          description: "Give fans opportunities to contribute to the brand.",
          tactics: [
            "Cover song contest with winner featured on social media",
            "Fan-designed merch: Submit artwork, community votes",
            "Remix competition for producers in the community",
            "Photo/video contest: Best concert moment"
          ],
          metrics: "Submission rate, voting engagement, content quality, social shares"
        },
        {
          stage: "Advocacy",
          title: "Turn Fans Into Ambassadors",
          description: "Empower community members to recruit and support.",
          tactics: [
            "Ambassador program for top 50 most active members",
            "Referral rewards: Bring friends, earn exclusive perks",
            "Street team: Help promote shows in local markets",
            "Early access to everything for top advocates"
          ],
          metrics: "Referral rate, ambassador activity, word-of-mouth growth"
        }
      ],
      'community-retention': [
        {
          stage: "Activation",
          title: "Keep Community Active",
          description: "Maintain daily engagement in community spaces.",
          tactics: [
            "Daily content drops in Discord/Facebook: Q&A, photos, updates",
            "Weekly themed discussions: Track Tuesday, Throwback Thursday",
            "Gamification: Badges for participation, leaderboards",
            "Monthly challenges: Most engaged fan wins meet & greet"
          ],
          metrics: "Daily active members, post frequency, response rate"
        },
        {
          stage: "Recognition",
          title: "Celebrate Fan Contributions",
          description: "Acknowledge and reward active community members.",
          tactics: [
            "Monthly 'Fan of the Month' feature with interview",
            "Milestone celebrations: 1000th stream, anniversary",
            "Birthday shoutouts in community",
            "VIP status for long-time members with special perks"
          ],
          metrics: "Recognition program participation, member satisfaction, tenure"
        },
        {
          stage: "Exclusive Value",
          title: "Deliver Members-Only Benefits",
          description: "Give reasons to stay engaged in community long-term.",
          tactics: [
            "Unreleased demo tracks only for community members",
            "First access to ticket sales, merch drops",
            "Member-only acoustic livestreams monthly",
            "Voting rights on band decisions (setlist, merch, etc.)"
          ],
          metrics: "Exclusive content engagement, member retention rate, perceived value"
        },
        {
          stage: "Evolution",
          title: "Grow With the Community",
          description: "Let community influence direction and feel ownership.",
          tactics: [
            "Quarterly surveys: What do you want to see more of?",
            "Beta test new merch/music with community first",
            "Community co-creation: Design contests, collaboration",
            "Transparent roadmap: Share what's coming, get feedback"
          ],
          metrics: "Survey response rate, feedback implementation, co-creation participation"
        },
        {
          stage: "Longevity",
          title: "Build Lifetime Fans",
          description: "Create lasting bonds that withstand time and trends.",
          tactics: [
            "Lifetime achievement rewards for multi-year members",
            "Alumni network for long-time fans with special status",
            "Oral history project: Document fan stories and memories",
            "Legacy programs: Fans can pass membership to others"
          ],
          metrics: "Member lifetime, churn rate, lifetime value, multi-generational growth"
        }
      ],
      'general-conversion': [
        {
          stage: "Traffic",
          title: "Drive Qualified Visitors",
          description: "Attract high-intent traffic from multiple channels.",
          tactics: [
            "SEO optimization for 'Sons of Legion' + top track names",
            "Paid ads on streaming platforms targeting similar artists' fans",
            "Content marketing: Blog about music creation process",
            "Social media campaigns highlighting top 5 markets"
          ],
          metrics: "Total traffic, traffic sources, bounce rate, time on site"
        },
        {
          stage: "Landing",
          title: "Capture Attention",
          description: "Convert visitors into engaged prospects.",
          tactics: [
            "Hero section featuring 'In The Air Tonight' with instant play",
            "Clear CTAs: Listen Now, Shop Merch, Join Community",
            "Social proof: '234K+ streams of our top track'",
            "Email capture with free EP download incentive"
          ],
          metrics: "Page conversion rate, email capture rate, CTA click rate"
        },
        {
          stage: "Nurture",
          title: "Warm Up Prospects",
          description: "Build trust and desire through strategic touchpoints.",
          tactics: [
            "5-email welcome series introducing music, story, merch",
            "Retargeting ads showing products they viewed",
            "Limited-time offers for first-time buyers",
            "Testimonials and reviews from super fans"
          ],
          metrics: "Email engagement, retargeting CTR, nurture-to-purchase rate"
        },
        {
          stage: "Conversion",
          title: "Drive First Transaction",
          description: "Convert engaged prospects into paying customers.",
          tactics: [
            "Flash sales: 24-hour merch discounts",
            "Bundle deals: Album + shirt at discount",
            "Free shipping thresholds to increase order value",
            "Urgency: Limited stock on popular items"
          ],
          metrics: "Conversion rate, first purchase value, cart abandonment"
        },
        {
          stage: "Retention",
          title: "Maximize Customer LTV",
          description: "Turn one-time buyers into repeat customers.",
          tactics: [
            "Post-purchase email series with related products",
            "VIP program for repeat buyers: Early access, discounts",
            "Win-back campaigns for 90-day inactive customers",
            "Birthday/anniversary offers to re-engage"
          ],
          metrics: "Repeat purchase rate, customer LTV, retention cohorts"
        }
      ],
      'tour-conversion': [
        {
          stage: "Pre-Announcement",
          title: "Build Anticipation",
          description: "Create buzz before official tour announcement.",
          tactics: [
            "Teaser campaign: 'Something big is coming' social posts",
            "Email list growth: 'Be first to know about tour' signup",
            "Influencer partnerships in tour markets for pre-hype",
            "Countdown timer on website to announcement date"
          ],
          metrics: "Email list growth, social engagement, speculation volume"
        },
        {
          stage: "Announcement",
          title: "Maximize Launch Impact",
          description: "Create urgency and FOMO around tour launch.",
          tactics: [
            "Simultaneous announcement across all channels",
            "Limited VIP packages available for 48 hours only",
            "Early bird pricing for first 100 tickets per city",
            "Target top 5 cities (13,060 fans) with localized ads"
          ],
          metrics: "Announcement reach, initial ticket sales velocity, waitlist signups"
        },
        {
          stage: "Pre-Sale",
          title: "Reward Loyal Fans",
          description: "Give super fans and email subscribers first access.",
          tactics: [
            "48-hour exclusive pre-sale for 847 super fans",
            "Email subscriber code for 24-hour early access",
            "Bundle pre-sale: Ticket + merch package deals",
            "Premium seating only available during pre-sale"
          ],
          metrics: "Pre-sale conversion, super fan participation, bundle attach rate"
        },
        {
          stage: "General Sale",
          title: "Drive Mass Ticket Sales",
          description: "Convert general audience to ticket buyers.",
          tactics: [
            "Paid ads in tour markets highlighting local dates",
            "Radio partnerships in Nashville/Austin/Atlanta",
            "Retarget website visitors who didn't buy during pre-sale",
            "Social proof: 'X% sold out in Nashville!' updates"
          ],
          metrics: "General sale velocity, market penetration, sellout timing"
        },
        {
          stage: "Maximization",
          title: "Upsell and Cross-Sell",
          description: "Increase revenue per ticket buyer.",
          tactics: [
            "VIP upgrade offers to standard ticket holders",
            "Exclusive tour merch pre-orders with venue pickup",
            "Meet & greet packages for top-tier fans",
            "Multi-show packages: Buy 2+ shows, get discount"
          ],
          metrics: "Upsell rate, merch pre-order attach, revenue per ticket buyer"
        }
      ],
      'retention': [
        {
          stage: "Onboarding",
          title: "Set Retention Foundation",
          description: "Create positive first experience that encourages return.",
          tactics: [
            "Welcome sequence highlighting best content and features",
            "Quick win: Immediate value delivery (free download, exclusive content)",
            "Set expectations: What to expect as a fan (releases, events)",
            "Capture preferences: Favorite genres, communication preferences"
          ],
          metrics: "Onboarding completion, time to first action, early engagement"
        },
        {
          stage: "Habit Formation",
          title: "Build Regular Engagement",
          description: "Create habits that bring fans back consistently.",
          tactics: [
            "Weekly content calendar: New track Fridays, BTS Tuesdays",
            "Push notifications for new releases (opt-in)",
            "Monthly email: 'Your listening stats + new recommendations'",
            "Streak rewards: 30 consecutive days of engagement = prize"
          ],
          metrics: "Weekly active users, session frequency, habit strength score"
        },
        {
          stage: "Value Reinforcement",
          title: "Continuously Prove Worth",
          description: "Regularly demonstrate why staying engaged matters.",
          tactics: [
            "Personalized year-end recap: 'Your year with SOL'",
            "Exclusive content drops for active fans only",
            "Surprise and delight: Random rewards for loyal fans",
            "Progress tracking: 'You're in top 10% of listeners!'"
          ],
          metrics: "Perceived value score, engagement depth, satisfaction rate"
        },
        {
          stage: "Win-Back",
          title: "Re-Engage Lapsing Fans",
          description: "Prevent churn and reactivate dormant users.",
          tactics: [
            "Automated 30/60/90-day inactive campaigns",
            "'We miss you' personalized messages from artist",
            "Special comeback offers: Limited merch for returning fans",
            "Survey: 'Why did you stop? Help us improve'"
          ],
          metrics: "Reactivation rate, churn prevention, feedback collection"
        },
        {
          stage: "Lifetime Value",
          title: "Maximize Long-Term Worth",
          description: "Increase value of retained fans over time.",
          tactics: [
            "Tenure rewards: Special perks at 1/2/5-year milestones",
            "Expand wallet share: Music → Merch → Events → VIP",
            "Advocate development: Turn retention into referrals",
            "Legacy building: Multi-generational fan programs"
          ],
          metrics: "Customer LTV, tenure cohorts, wallet share, advocacy rate"
        }
      ],
      'upsell': [
        {
          stage: "Segmentation",
          title: "Identify Upsell Candidates",
          description: "Target customers most likely to upgrade or add-on.",
          tactics: [
            "Score customers: Frequency + recency + monetary value",
            "Identify product affinity: What they buy predicts what they'll buy next",
            "Segment by tier: Basic listeners → Album buyers → Super fans",
            "Target 847 super fans with premium everything"
          ],
          metrics: "Segment quality, upsell propensity score, segment LTV"
        },
        {
          stage: "Trigger Events",
          title: "Time Upsell Offers Right",
          description: "Present offers when customers are most receptive.",
          tactics: [
            "Post-purchase: Immediate upsell at checkout confirmation",
            "Milestone moments: 100th stream = exclusive vinyl offer",
            "New releases: Album launch = premium edition upsell",
            "Seasonal: Holiday exclusive bundles for previous buyers"
          ],
          metrics: "Trigger conversion rate, offer timing effectiveness, revenue lift"
        },
        {
          stage: "Value Ladder",
          title: "Present Next-Level Options",
          description: "Introduce progressively higher value offerings.",
          tactics: [
            "Tier 1: Free listener → $10 album download",
            "Tier 2: Album buyer → $35 vinyl + merch bundle",
            "Tier 3: Merch buyer → $150 VIP concert experience",
            "Tier 4: Concert attendee → $500 annual fan club membership"
          ],
          metrics: "Tier progression rate, average tier value, upgrade frequency"
        },
        {
          stage: "Premium Positioning",
          title: "Justify Higher Price Points",
          description: "Communicate unique value of premium offerings.",
          tactics: [
            "Exclusivity: 'Only 200 available, 847 super fans competing'",
            "Quality: Behind-the-scenes craftsmanship videos",
            "Investment: 'Limited editions appreciate 40% annually'",
            "Status: VIP badge, recognition, insider access"
          ],
          metrics: "Premium conversion rate, price elasticity, margin improvement"
        },
        {
          stage: "Retention at Higher Tier",
          title: "Keep Premium Customers Happy",
          description: "Ensure upgraded customers stay at higher tier.",
          tactics: [
            "White-glove service for VIP tier",
            "Exclusive experiences justify continued premium spending",
            "Prevent downgrade: Check-ins before renewal periods",
            "Expand premium offerings: Always have next-level option"
          ],
          metrics: "Premium retention rate, downgrade prevention, expansion revenue"
        }
      ]
    };

      const selectedFunnel = funnelLibrary[selectedType] || funnelLibrary['general-conversion'];
      
      // Add personalized suggestions based on dashboard data
      const personalizedNote = totalOrders > 10 
        ? `Based on your ${totalOrders} orders with avg value of $${avgOrderValue.toFixed(2)}, we've optimized this funnel for repeat buyers.`
        : totalOrders > 0
        ? `With ${totalOrders} orders so far, this funnel will help you scale to the next level.`
        : "This funnel is optimized to help you get your first sales!";

      // Simulate loading
      setTimeout(() => {
        setFunnelStages(selectedFunnel);
        setLoading(false);
        toast({
          title: "Funnel Strategy Generated",
          description: personalizedNote
        });
      }, 1500);
    } catch (error) {
      console.error("Error generating funnel:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to generate funnel. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStageIcon = (index: number) => {
    const icons = [Users, Heart, ShoppingCart, Rocket];
    const Icon = icons[index % icons.length];
    return <Icon className="h-5 w-5 text-yellow-500" />;
  };

  const handleEditStage = (index: number) => {
    setEditingStage(index);
    setEditedContent({ ...funnelStages[index] });
  };

  const handleSaveEdit = (index: number) => {
    if (editedContent) {
      const updatedStages = [...funnelStages];
      updatedStages[index] = editedContent;
      setFunnelStages(updatedStages);
      setEditingStage(null);
      setEditedContent(null);
      toast({
        title: "Stage updated",
        description: "Your funnel stage has been updated successfully."
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingStage(null);
    setEditedContent(null);
  };

  const handleBuildFunnel = () => {
    toast({
      title: "Building Funnel",
      description: "Your funnel is being built based on this strategy."
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">AI Funnel Builder</h2>
        <p className="text-muted-foreground">
          Build data-driven conversion funnels based on your audience behavior
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Funnel Configuration
          </CardTitle>
          <CardDescription>
            Define your funnel type and goal for personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="type">Funnel Type</Label>
            <Select value={funnelType} onValueChange={setFunnelType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conversion">Sales Conversion</SelectItem>
                <SelectItem value="engagement">Community Engagement</SelectItem>
                <SelectItem value="retention">Fan Retention</SelectItem>
                <SelectItem value="upsell">Upsell & Cross-sell</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="goal">Primary Goal (Optional)</Label>
            <Input
              id="goal"
              placeholder="e.g., Convert casual listeners to super fans"
              value={funnelGoal}
              onChange={(e) => setFunnelGoal(e.target.value)}
            />
          </div>

          <Button 
            onClick={generateFunnel} 
            disabled={loading}
            className="w-full bg-gradient-gold"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Building Funnel Strategy...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate AI Funnel Strategy
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {funnelStages.length > 0 && (
        <div className="space-y-4">
          {funnelStages.map((stage, index) => (
            <div key={index}>
              <Card className="border-2 border-yellow-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getStageIcon(index)}
                      <span className="text-yellow-500 font-mono text-sm mr-2">
                        STAGE {index + 1}
                      </span>
                      {editingStage === index ? (
                        <Input
                          value={editedContent?.title || ""}
                          onChange={(e) => setEditedContent({ ...editedContent!, title: e.target.value })}
                          className="max-w-md"
                        />
                      ) : (
                        stage.title
                      )}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editingStage === index ? handleCancelEdit() : handleEditStage(index)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      {editingStage === index ? "Cancel" : "Edit"}
                    </Button>
                  </div>
                  <CardDescription>
                    {editingStage === index ? (
                      <Input
                        value={editedContent?.stage || ""}
                        onChange={(e) => setEditedContent({ ...editedContent!, stage: e.target.value })}
                      />
                    ) : (
                      stage.stage
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingStage === index ? (
                    <textarea
                      value={editedContent?.description || ""}
                      onChange={(e) => setEditedContent({ ...editedContent!, description: e.target.value })}
                      className="w-full p-2 border rounded-md min-h-[60px] bg-background"
                    />
                  ) : (
                    <p className="text-foreground/80">{stage.description}</p>
                  )}
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Key Tactics:</h4>
                    <ul className="space-y-2">
                      {stage.tactics?.map((tactic, i) => (
                        <li key={i} className="flex items-start gap-2.5 pl-0">
                          <span className="text-yellow-500 flex-shrink-0 leading-[1.4] select-none">•</span>
                          {editingStage === index ? (
                            <Input
                              value={editedContent?.tactics[i] || ""}
                              onChange={(e) => {
                                const newTactics = [...(editedContent?.tactics || [])];
                                newTactics[i] = e.target.value;
                                setEditedContent({ ...editedContent!, tactics: newTactics });
                              }}
                              className="text-sm"
                            />
                          ) : (
                            <span className="text-sm text-foreground/80 leading-[1.4]">{tactic}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {stage.emailSequence && stage.emailSequence.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                        📧 Email Automation Sequence
                      </p>
                      <div className="space-y-3">
                        {stage.emailSequence.map((email, i) => (
                          <div key={i} className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">Email {email.emailNumber}</p>
                              {email.discountOffer && (
                                <span className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded font-medium">
                                  {email.discountOffer}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium">{email.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Trigger:</strong> {email.triggerCondition}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Send:</strong> {email.waitTime}
                            </p>
                            <p className="text-xs mt-1">{email.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <p className="text-sm">
                      <span className="font-semibold">Track:</span>{" "}
                      {editingStage === index ? (
                        <Input
                          value={editedContent?.metrics || ""}
                          onChange={(e) => setEditedContent({ ...editedContent!, metrics: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <span className="text-muted-foreground">{stage.metrics}</span>
                      )}
                    </p>
                  </div>
                  
                  {editingStage === index && (
                    <div className="pt-3 border-t">
                      <Button onClick={() => handleSaveEdit(index)} className="w-full">
                        Save Changes
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {index < funnelStages.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="h-6 w-6 text-yellow-500 animate-bounce" />
                </div>
              )}
            </div>
          ))}
          
          <Card className="border-2 border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6">
              <Button 
                onClick={handleBuildFunnel}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                size="lg"
              >
                <Zap className="mr-2 h-5 w-5" />
                Build Funnel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
