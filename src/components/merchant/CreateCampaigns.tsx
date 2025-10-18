import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Target, TrendingUp, Calendar, DollarSign } from "lucide-react";

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
  const { toast } = useToast();

  const generateCampaigns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('merchant-chat', {
        body: {
          message: `Based on user behavior analytics, generate 3 campaign suggestions${campaignGoal ? ` focused on: ${campaignGoal}` : ''}. Return only a JSON array with objects containing: title, description, targetAudience, expectedROI, timeline.`,
          type: 'campaign'
        }
      });

      if (error) throw error;

      if (data?.reply) {
        try {
          const parsed = JSON.parse(data.reply);
          setSuggestions(Array.isArray(parsed) ? parsed : [parsed]);
        } catch {
          toast({
            title: "Error",
            description: "Failed to parse campaign suggestions",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error generating campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to generate campaign suggestions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-yellow-500" />
                  {suggestion.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground/80">{suggestion.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-semibold">Target Audience</p>
                      <p className="text-sm text-muted-foreground">{suggestion.targetAudience}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-semibold">Expected ROI</p>
                      <p className="text-sm text-muted-foreground">{suggestion.expectedROI}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-semibold">Timeline</p>
                      <p className="text-sm text-muted-foreground">{suggestion.timeline}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
