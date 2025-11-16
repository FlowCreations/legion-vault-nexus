import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Target, MapPin, Users, TrendingUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SmartCampaignBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [goal, setGoal] = useState("");
  const [campaignType, setCampaignType] = useState("event");
  const [eventCity, setEventCity] = useState("");
  const [eventState, setEventState] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const handleCreateCampaign = async () => {
    if (!goal || !eventCity || !eventDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('smart_campaigns')
        .insert({
          goal,
          campaign_type: campaignType,
          event_location: {
            city: eventCity,
            state: eventState,
            // In real implementation, geocode the city to get lat/lon
            latitude: 40.7128, // NYC example
            longitude: -74.0060
          },
          event_date: eventDate,
          target_radius_miles: 120,
          ptp_min: 0.4,
          ptp_max: 1.0,
          min_loyalty_score: 0
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Trigger AI analysis
      const { data, error } = await supabase.functions.invoke('analyze-campaign-targets', {
        body: { campaignId: campaign.id }
      });

      if (error) throw error;

      setAnalysisResults(data);
      
      toast({
        title: "Campaign Analyzed!",
        description: `${data.targetCount} users automatically targeted based on your goal`
      });

    } catch (error: any) {
      console.error('Campaign creation error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Smart AI Funnel Builder
          </h1>
          <p className="text-muted-foreground">AI automatically finds and targets the right audience for your goal</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Campaign Setup */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Campaign Goal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="goal">What's your goal?</Label>
                  <Textarea
                    id="goal"
                    placeholder="e.g., Sell out tickets for NYC show on Dec 15th"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="mt-1 min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="eventCity">Event City</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="eventCity"
                      placeholder="New York"
                      value={eventCity}
                      onChange={(e) => setEventCity(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="NY"
                      value={eventState}
                      onChange={(e) => setEventState(e.target.value)}
                      className="w-20"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={handleCreateCampaign}
                  disabled={isAnalyzing}
                  className="w-full h-12 text-lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      AI Analyzing Audience...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Auto-Target with AI
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Analysis Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="border-primary/20">
                    <CardContent className="py-12 text-center">
                      <div className="mb-4">
                        <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">AI is Analyzing Your Audience</h3>
                      <p className="text-muted-foreground">
                        Scanning location data, PTP scores, loyalty levels, and engagement patterns...
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : analysisResults ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Targeting Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Total Targeted */}
                      <div className="text-center p-6 bg-primary/10 rounded-lg">
                        <div className="text-5xl font-bold text-primary mb-2">
                          {analysisResults.targetCount}
                        </div>
                        <div className="text-sm text-muted-foreground">Users Automatically Selected</div>
                      </div>

                      {/* Breakdown */}
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Audience Breakdown
                        </h4>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                            <span className="text-sm">Within 50 miles (local)</span>
                            <span className="font-semibold text-primary">
                              {analysisResults.breakdown?.within_50_miles || 0}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                            <span className="text-sm">Within 2h drive (50-120 mi)</span>
                            <span className="font-semibold text-primary">
                              {analysisResults.breakdown?.within_120_miles || 0}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                            <span className="text-sm">Loyal fans (high loyalty)</span>
                            <span className="font-semibold text-primary">
                              {analysisResults.breakdown?.loyal_fans || 0}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                            <span className="text-sm">High motivation (PTP)</span>
                            <span className="font-semibold text-primary">
                              {analysisResults.breakdown?.high_ptp || 0}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                            <span className="text-sm">Recently engaged</span>
                            <span className="font-semibold text-primary">
                              {analysisResults.breakdown?.recent_engagement || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* AI Reasoning */}
                      {analysisResults.analysis?.reasoning && (
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            AI Targeting Strategy
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {analysisResults.analysis.reasoning}
                          </p>
                        </div>
                      )}

                      <Button 
                        className="w-full"
                        onClick={() => navigate('/merchant/campaigns')}
                      >
                        View Campaign Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Card className="border-dashed border-2 border-muted">
                    <CardContent className="py-12 text-center">
                      <Target className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">
                        Enter your campaign goal to see AI-powered targeting results
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
