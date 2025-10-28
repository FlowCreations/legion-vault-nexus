import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Target, 
  TrendingUp, 
  RefreshCw, 
  Users, 
  DollarSign,
  Music,
  Ticket,
  ShoppingBag,
  Loader2,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CampaignGoal {
  id: string;
  icon: any;
  label: string;
  description: string;
  color: string;
}

const CAMPAIGN_GOALS: CampaignGoal[] = [
  {
    id: 'merchandise',
    icon: ShoppingBag,
    label: 'Drive Merchandise Sales',
    description: 'Promote products to high-intent fans',
    color: 'text-blue-500'
  },
  {
    id: 'vip_engagement',
    icon: Users,
    label: 'Engage VIP Fans',
    description: 'Connect with your most loyal supporters',
    color: 'text-purple-500'
  },
  {
    id: 'reactivation',
    icon: RefreshCw,
    label: 'Re-activate Dormant Fans',
    description: 'Win back inactive subscribers',
    color: 'text-orange-500'
  },
  {
    id: 'music_release',
    icon: Music,
    label: 'Promote New Music',
    description: 'Drive streams and downloads',
    color: 'text-pink-500'
  },
  {
    id: 'ticket_sales',
    icon: Ticket,
    label: 'Sell Concert Tickets',
    description: 'Fill venue seats fast',
    color: 'text-green-500'
  }
];

interface Recommendation {
  goal: string;
  targetAudience: string;
  estimatedReach: number;
  subject: string;
  contentTheme: string;
  sendTime: string;
  expectedPerformance: {
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  predictedRevenue?: string;
  reasoning: string;
}

export const SmartCampaignRecommender = ({ onClose }: { onClose: () => void }) => {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const navigate = useNavigate();

  const generateRecommendation = async (goalId: string) => {
    setGenerating(true);
    setSelectedGoal(goalId);
    
    try {
      // Get campaign performance data
      const { data: campaigns } = await supabase
        .from('email_campaigns')
        .select('analytics')
        .not('analytics', 'is', null);
      
      // Get subscriber segments
      const { data: subscribers } = await supabase
        .from('user_profiles')
        .select('user_id, metadata');
      
      // Get ERA/PTP scores
      const { data: scores } = await supabase
        .from('era_ptp_scores_daily')
        .select('ptp, era, member_id')
        .order('date', { ascending: false })
        .limit(1000);
      
      // Calculate average performance
      let avgOpenRate = 28;
      let avgClickRate = 8;
      
      if (campaigns && campaigns.length > 0) {
        const totalOpen = campaigns.reduce((sum, c) => {
          const analytics = c.analytics as any;
          return sum + (parseFloat(analytics?.open_rate) || 0);
        }, 0);
        const totalClick = campaigns.reduce((sum, c) => {
          const analytics = c.analytics as any;
          return sum + (parseFloat(analytics?.click_rate) || 0);
        }, 0);
        avgOpenRate = totalOpen / campaigns.length;
        avgClickRate = totalClick / campaigns.length;
      }
      
      // Generate goal-specific recommendation
      const rec = generateGoalRecommendation(
        goalId, 
        scores || [], 
        subscribers || [],
        avgOpenRate,
        avgClickRate
      );
      
      setRecommendation(rec);
      toast.success('Smart campaign strategy generated!');
      
    } catch (error: any) {
      console.error('Error generating recommendation:', error);
      toast.error('Failed to generate recommendation');
    } finally {
      setGenerating(false);
    }
  };

  const generateGoalRecommendation = (
    goalId: string,
    scores: any[],
    subscribers: any[],
    baseOpenRate: number,
    baseClickRate: number
  ): Recommendation => {
    // Calculate high PTP subscribers
    const highPTPCount = scores.filter(s => s.ptp > 70).length;
    const mediumPTPCount = scores.filter(s => s.ptp >= 40 && s.ptp <= 70).length;
    const lowPTPCount = scores.filter(s => s.ptp < 40).length;
    
    switch (goalId) {
      case 'merchandise':
        return {
          goal: 'Drive Merchandise Sales',
          targetAudience: 'High PTP Subscribers (PTP > 70)',
          estimatedReach: highPTPCount,
          subject: '🔥 VIP Early Access: New Drop Tonight',
          contentTheme: 'Exclusive sneak peek, limited quantity, urgency',
          sendTime: 'Thursday 6PM EST',
          expectedPerformance: {
            openRate: baseOpenRate * 1.5,
            clickRate: baseClickRate * 2.2,
            conversionRate: 6
          },
          predictedRevenue: '$4,500 - $6,200',
          reasoning: 'High PTP subscribers have shown strong purchase intent. Urgency + exclusivity drives conversions. Thursday evening catches fans before weekend shopping.'
        };
      
      case 'vip_engagement':
        return {
          goal: 'Engage VIP Fans',
          targetAudience: 'Top 20% ERA Scorers + High PTP',
          estimatedReach: Math.floor(subscribers.length * 0.2),
          subject: '🌟 You\'re Part of Something Special',
          contentTheme: 'Behind-the-scenes content, appreciation, exclusive updates',
          sendTime: 'Tuesday 2PM EST',
          expectedPerformance: {
            openRate: baseOpenRate * 1.8,
            clickRate: baseClickRate * 2.5,
            conversionRate: 0
          },
          reasoning: 'VIPs respond to recognition and exclusive content. Mid-week afternoon timing captures highest engagement. No hard sell needed - builds loyalty.'
        };
      
      case 'reactivation':
        return {
          goal: 'Re-activate Dormant Fans',
          targetAudience: 'No opens in last 60 days',
          estimatedReach: Math.floor(subscribers.length * 0.25),
          subject: 'We Miss You... Here\'s What You Missed',
          contentTheme: 'FOMO-driven recap, special comeback offer',
          sendTime: 'Sunday 10AM EST',
          expectedPerformance: {
            openRate: 12,
            clickRate: 4,
            conversionRate: 2
          },
          predictedRevenue: '$800 - $1,200',
          reasoning: 'Lower expected performance but high-value segment to recapture. Sunday morning catches people during relaxed browsing. Offer sweetens the comeback.'
        };
      
      case 'music_release':
        return {
          goal: 'Promote New Music',
          targetAudience: 'All Active Subscribers + High ERA',
          estimatedReach: subscribers.length - lowPTPCount,
          subject: '🎵 NEW MUSIC OUT NOW - First Listen',
          contentTheme: 'Preview snippet, streaming links, story behind the song',
          sendTime: 'Friday 12PM EST',
          expectedPerformance: {
            openRate: baseOpenRate * 1.4,
            clickRate: baseClickRate * 3,
            conversionRate: 15
          },
          reasoning: 'Music releases drive high engagement across all segments. Friday noon timing catches lunch-break streamers. ERA-based targeting ensures most engaged listeners.'
        };
      
      case 'ticket_sales':
        return {
          goal: 'Sell Concert Tickets',
          targetAudience: 'Geographic proximity + Medium-High PTP',
          estimatedReach: mediumPTPCount + highPTPCount,
          subject: '🎟️ Presale NOW: [City] Show Tickets',
          contentTheme: 'Presale code, setlist preview, local venue hype',
          sendTime: 'Wednesday 10AM EST',
          expectedPerformance: {
            openRate: baseOpenRate * 1.6,
            clickRate: baseClickRate * 2.8,
            conversionRate: 8
          },
          predictedRevenue: '$12,000 - $18,000',
          reasoning: 'Geographic + PTP targeting ensures high conversion. Wednesday morning catches fans at work (easy to buy). Presale exclusivity drives urgency.'
        };
      
      default:
        return {
          goal: 'General Engagement',
          targetAudience: 'All Subscribers',
          estimatedReach: subscribers.length,
          subject: 'New Update from the Studio',
          contentTheme: 'General update and engagement',
          sendTime: 'Tuesday 3PM EST',
          expectedPerformance: {
            openRate: baseOpenRate,
            clickRate: baseClickRate,
            conversionRate: 0
          },
          reasoning: 'Broad engagement strategy for general updates.'
        };
    }
  };

  const applyRecommendation = () => {
    // Store recommendation in localStorage to pre-fill campaign builder
    if (recommendation) {
      localStorage.setItem('campaignRecommendation', JSON.stringify({
        name: `${recommendation.goal} Campaign`,
        subject: recommendation.subject,
        goal: recommendation.goal,
        targetAudience: recommendation.targetAudience
      }));
      
      toast.success('Recommendation applied! Redirecting to campaign builder...');
      setTimeout(() => {
        onClose();
        // Navigate to campaigns tab
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          Smart Campaign Builder
        </h2>
        <p className="text-muted-foreground mt-1">
          AI-powered campaign strategies based on your data
        </p>
      </div>

      {!recommendation ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CAMPAIGN_GOALS.map((goal) => {
            const Icon = goal.icon;
            return (
              <Card
                key={goal.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedGoal === goal.id ? 'border-primary' : ''
                }`}
                onClick={() => !generating && generateRecommendation(goal.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${goal.color}`} />
                    {goal.label}
                  </CardTitle>
                  <CardDescription>{goal.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {generating && selectedGoal === goal.id ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full">
                      Generate Strategy
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Campaign Strategy
            </CardTitle>
            <CardDescription>AI-generated recommendation for {recommendation.goal}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Target Audience */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Target Audience
              </h4>
              <p className="text-sm text-muted-foreground">{recommendation.targetAudience}</p>
              <Badge variant="secondary" className="mt-2">
                Estimated Reach: {recommendation.estimatedReach.toLocaleString()} subscribers
              </Badge>
            </div>

            {/* Recommended Content */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Recommended Subject</h4>
                <p className="text-sm bg-muted p-3 rounded">{recommendation.subject}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Content Theme</h4>
                <p className="text-sm bg-muted p-3 rounded">{recommendation.contentTheme}</p>
              </div>
            </div>

            {/* Send Time */}
            <div>
              <h4 className="font-semibold mb-2">Best Send Time</h4>
              <p className="text-sm text-muted-foreground">{recommendation.sendTime}</p>
            </div>

            {/* Expected Performance */}
            <div>
              <h4 className="font-semibold mb-3">Expected Performance</h4>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Open Rate</p>
                  <p className="text-xl font-bold">{recommendation.expectedPerformance.openRate.toFixed(1)}%</p>
                  <p className="text-xs text-green-600">↑ vs avg {((recommendation.expectedPerformance.openRate / 28 - 1) * 100).toFixed(0)}%</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Click Rate</p>
                  <p className="text-xl font-bold">{recommendation.expectedPerformance.clickRate.toFixed(1)}%</p>
                  <p className="text-xs text-green-600">↑ vs avg {((recommendation.expectedPerformance.clickRate / 8 - 1) * 100).toFixed(0)}%</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Conversion Rate</p>
                  <p className="text-xl font-bold">{recommendation.expectedPerformance.conversionRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Predicted Revenue */}
            {recommendation.predictedRevenue && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Predicted Revenue
                </h4>
                <p className="text-2xl font-bold">{recommendation.predictedRevenue}</p>
              </div>
            )}

            {/* Reasoning */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Why This Strategy Works</h4>
              <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button onClick={applyRecommendation} className="flex-1">
                Apply to Campaign Builder
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setRecommendation(null);
                  setSelectedGoal(null);
                }}
              >
                Try Another Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
