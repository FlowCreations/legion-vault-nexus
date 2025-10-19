import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowDown, Users, ShoppingCart, Heart, Rocket } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FunnelStage {
  stage: string;
  title: string;
  description: string;
  tactics: string[];
  metrics: string;
}

export const BuildFunnel = () => {
  const [loading, setLoading] = useState(false);
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  const [funnelGoal, setFunnelGoal] = useState("");
  const [funnelType, setFunnelType] = useState("conversion");
  const { toast } = useToast();

  const generateFunnel = async () => {
    setLoading(true);
    
    // Mock funnel data for demonstration
    const mockFunnelStages: FunnelStage[] = [
      {
        stage: "Awareness",
        title: "Attract New Listeners",
        description: "Drive discovery through strategic content placement and viral moments. Focus on platforms where your music is already gaining traction organically.",
        tactics: [
          "Run targeted ads on streaming platforms highlighting 'In The Air Tonight' (+12% growth trend)",
          "Partner with Nashville and Austin local radio for regional domination",
          "Create shareable video content using top 3 tracks for social media virality",
          "Leverage UFC and ESPN brand partnerships for cross-promotion opportunities"
        ],
        metrics: "New unique listeners, social media reach, playlist adds, brand mention volume"
      },
      {
        stage: "Engagement",
        title: "Convert Casual to Active Fans",
        description: "Transform one-time listeners into regular engagers by creating multiple touchpoints and memorable experiences.",
        tactics: [
          "Email capture via free EP download (leverage existing 'Power' album strength)",
          "Interactive content: polls about next single, behind-the-scenes from studio",
          "Playlist creation guide: 'The Ultimate Sons of Legion Journey'",
          "Retarget users who streamed 2+ songs with exclusive acoustic session content"
        ],
        metrics: "Email list growth, avg. streams per user, social engagement rate, repeat visit rate"
      },
      {
        stage: "Conversion",
        title: "Monetize the Relationship",
        description: "Turn engaged fans into paying customers through strategic product offerings aligned with their behavior patterns.",
        tactics: [
          "Limited-edition merch drops tied to top-performing tracks (NY collection performing well)",
          "Album + merch bundles for power users (target the 847 super fans first)",
          "VIP concert tickets pre-sale for email subscribers in top 5 cities",
          "Exclusive vinyl releases with signed artwork for collectors"
        ],
        metrics: "Conversion rate, average order value, merch attach rate, ticket sales velocity"
      },
      {
        stage: "Retention",
        title: "Build Long-Term Loyalty",
        description: "Keep super fans engaged and spending through exclusive experiences and community building.",
        tactics: [
          "Monthly super fan newsletter with unreleased tracks and insider updates",
          "Points-based rewards program: streams + purchases = exclusive perks",
          "Virtual meet & greets for top-tier supporters (gamify engagement)",
          "Early access to tour announcements and VIP packages"
        ],
        metrics: "Customer lifetime value, repeat purchase rate, churn rate, referral rate"
      },
      {
        stage: "Advocacy",
        title: "Turn Fans Into Ambassadors",
        description: "Empower your most loyal fans to spread the word and bring new listeners into the funnel.",
        tactics: [
          "Referral program: 'Bring a friend to the legion' discount codes",
          "User-generated content contests with prizes (best cover, fan art, etc.)",
          "Ambassador program for top 50 super fans with exclusive swag and perks",
          "Feature fan stories and testimonials in marketing campaigns"
        ],
        metrics: "Net Promoter Score, referral conversion rate, UGC volume, social sharing rate"
      }
    ];

    // Simulate loading
    setTimeout(() => {
      setFunnelStages(mockFunnelStages);
      setLoading(false);
      toast({
        title: "Funnel Strategy Generated",
        description: `${funnelType} funnel created based on your analytics`
      });
    }, 1500);
  };

  const getStageIcon = (index: number) => {
    const icons = [Users, Heart, ShoppingCart, Rocket];
    const Icon = icons[index % icons.length];
    return <Icon className="h-5 w-5 text-yellow-500" />;
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
                  <CardTitle className="flex items-center gap-2">
                    {getStageIcon(index)}
                    <span className="text-yellow-500 font-mono text-sm mr-2">
                      STAGE {index + 1}
                    </span>
                    {stage.title}
                  </CardTitle>
                  <CardDescription>{stage.stage}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-foreground/80">{stage.description}</p>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Key Tactics:</h4>
                    <ul className="space-y-2">
                      {stage.tactics?.map((tactic, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-yellow-500 mt-1">•</span>
                          <span className="text-sm text-foreground/80">{tactic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-sm">
                      <span className="font-semibold">Track:</span>{" "}
                      <span className="text-muted-foreground">{stage.metrics}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {index < funnelStages.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="h-6 w-6 text-yellow-500 animate-bounce" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
