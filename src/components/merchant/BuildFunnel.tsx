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
    try {
      const { data, error } = await supabase.functions.invoke('merchant-chat', {
        body: {
          message: `Based on user behavior analytics, create a detailed ${funnelType} funnel strategy${funnelGoal ? ` with the goal of: ${funnelGoal}` : ''}. Return a JSON array of 4-5 funnel stages, each with: stage (name), title, description, tactics (array of 3-4 specific actions), metrics (key metrics to track).`,
          type: 'funnel'
        }
      });

      if (error) throw error;

      if (data?.reply) {
        try {
          const parsed = JSON.parse(data.reply);
          setFunnelStages(Array.isArray(parsed) ? parsed : [parsed]);
        } catch {
          toast({
            title: "Error",
            description: "Failed to parse funnel strategy",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error generating funnel:', error);
      toast({
        title: "Error",
        description: "Failed to generate funnel strategy",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
