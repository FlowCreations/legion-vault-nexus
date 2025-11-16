import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Target, Users, TrendingUp, Send, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const HybridFunnelBuilder = () => {
  const { toast } = useToast();
  
  const [goal, setGoal] = useState("");
  const [campaignType, setCampaignType] = useState("event");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [eventState, setEventState] = useState("");
  const [budgetTier, setBudgetTier] = useState("moderate");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [inboxEnabled, setInboxEnabled] = useState(true);
  const [popupEnabled, setPopupEnabled] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [estimatedReach, setEstimatedReach] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);

  // Real-time targeting analysis when goal changes
  useEffect(() => {
    const analyzeReach = async () => {
      if (!goal || goal.length < 10) {
        setEstimatedReach(null);
        return;
      }

      try {
        const { data: users, error } = await supabase
          .from('user_profiles')
          .select('ptp_score, ptp_status')
          .not('ptp_score', 'is', null);

        if (error) throw error;

        const greenUsers = users?.filter(u => (u.ptp_score || 0) >= 70).length || 0;
        const yellowUsers = users?.filter(u => (u.ptp_score || 0) >= 40 && (u.ptp_score || 0) < 70).length || 0;
        const redUsers = users?.filter(u => (u.ptp_score || 0) < 40).length || 0;

        let estimated = 0;
        if (budgetTier === 'minimal') estimated = greenUsers;
        else if (budgetTier === 'moderate') estimated = greenUsers + yellowUsers;
        else estimated = greenUsers + yellowUsers + redUsers;

        setEstimatedReach({
          total: estimated,
          green: greenUsers,
          yellow: yellowUsers,
          red: redUsers
        });
      } catch (error) {
        console.error('Error analyzing reach:', error);
      }
    };

    const debounce = setTimeout(analyzeReach, 500);
    return () => clearTimeout(debounce);
  }, [goal, budgetTier]);

  const handleCreateCampaign = async () => {
    if (!goal || !startDate || !startTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(startDateTime);
    endDateTime.setDate(endDateTime.getDate() + 7);

    setIsAnalyzing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create marketing campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('marketing_campaigns')
        .insert({
          merchant_id: user.id,
          goal,
          start_date: startDate,
          start_time: startTime,
          end_date: endDateTime.toISOString().split('T')[0],
          budget_tier: budgetTier,
          enabled_channels: {
            email: emailEnabled,
            sms: smsEnabled,
            inbox: inboxEnabled,
            popup: popupEnabled
          },
          target_criteria: {
            eventState,
            budgetTier
          }
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      setCurrentCampaignId(campaign.id);

      // Generate AI targets
      const { data, error } = await supabase.functions.invoke('generate-ai-targets', {
        body: { campaignId: campaign.id }
      });

      if (error) throw error;

      setAnalysisResults({
        targetCount: data.targetsGenerated,
        breakdown: data.breakdown,
        aiStrategy: data.aiStrategy,
        minPtpScore: data.minPtpScore
      });
      
      toast({
        title: "Campaign Created!",
        description: `${data.targetsGenerated} users targeted with AI intelligence`
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

  const handleSendNow = async () => {
    if (!currentCampaignId) {
      toast({
        title: "No Campaign",
        description: "Create a campaign first",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      const { error } = await supabase.functions.invoke('process-campaigns', {
        body: { campaignId: currentCampaignId }
      });

      if (error) throw error;

      toast({
        title: "Messages Sent!",
        description: "Your campaign messages are being delivered"
      });

    } catch (error: any) {
      console.error('Send error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
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
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Campaign will run for 7 days maximum
                </p>
              </div>

              <div>
                <Label>Budget Tier</Label>
                <RadioGroup value={budgetTier} onValueChange={setBudgetTier} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="minimal" id="minimal" />
                    <Label htmlFor="minimal" className="font-normal cursor-pointer">
                      Minimal - Email only, fewer touchpoints
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="moderate" />
                    <Label htmlFor="moderate" className="font-normal cursor-pointer">
                      Moderate - Email + SMS, balanced approach
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="aggressive" id="aggressive" />
                    <Label htmlFor="aggressive" className="font-normal cursor-pointer">
                      Aggressive - All 4 channels, maximum reach
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Enabled Channels</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-toggle" className="font-normal cursor-pointer flex items-center gap-2">
                      📧 Email
                    </Label>
                    <Switch
                      id="email-toggle"
                      checked={emailEnabled}
                      onCheckedChange={setEmailEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms-toggle" className="font-normal cursor-pointer flex items-center gap-2">
                      📱 SMS
                    </Label>
                    <Switch
                      id="sms-toggle"
                      checked={smsEnabled}
                      onCheckedChange={setSmsEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inbox-toggle" className="font-normal cursor-pointer flex items-center gap-2">
                      💬 Inbox
                    </Label>
                    <Switch
                      id="inbox-toggle"
                      checked={inboxEnabled}
                      onCheckedChange={setInboxEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="popup-toggle" className="font-normal cursor-pointer flex items-center gap-2">
                      🔔 Pop-Up
                    </Label>
                    <Switch
                      id="popup-toggle"
                      checked={popupEnabled}
                      onCheckedChange={setPopupEnabled}
                    />
                  </div>
                </div>
              </div>

              {/* Estimated Reach Preview */}
              {estimatedReach && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Estimated Reach
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-green-500/10 border border-green-500/20 rounded">
                      <div className="text-2xl font-bold text-green-500">{estimatedReach.green}</div>
                      <div className="text-xs text-muted-foreground">Green (High)</div>
                    </div>
                    <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                      <div className="text-2xl font-bold text-yellow-500">{estimatedReach.yellow}</div>
                      <div className="text-xs text-muted-foreground">Yellow (Med)</div>
                    </div>
                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                      <div className="text-2xl font-bold text-red-500">{estimatedReach.red}</div>
                      <div className="text-xs text-muted-foreground">Red (Low)</div>
                    </div>
                  </div>
                  <div className="mt-2 text-center text-sm text-muted-foreground">
                    Total: <span className="font-semibold text-primary">{estimatedReach.total}</span> users will be targeted
                  </div>
                </div>
              )}

              <div className="space-y-2">
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

                {currentCampaignId && (
                  <Button
                    onClick={handleSendNow}
                    disabled={isSending}
                    variant="outline"
                    className="w-full h-12 text-lg border-primary/20 hover:bg-primary/5"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending Messages...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Send Now (Test)
                      </>
                    )}
                  </Button>
                )}
              </div>
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

                    {/* PTP Breakdown */}
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        PTP Score Distribution
                      </h4>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg text-center">
                          <div className="text-3xl font-bold text-green-500 mb-1">
                            {analysisResults.breakdown?.green || 0}
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">Green Users</div>
                          <div className="text-xs font-semibold text-green-600">70-100 PTP</div>
                          <div className="text-xs text-muted-foreground mt-1">High conversion</div>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-lg text-center">
                          <div className="text-3xl font-bold text-yellow-500 mb-1">
                            {analysisResults.breakdown?.yellow || 0}
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">Yellow Users</div>
                          <div className="text-xs font-semibold text-yellow-600">40-69 PTP</div>
                          <div className="text-xs text-muted-foreground mt-1">Nurture needed</div>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-lg text-center">
                          <div className="text-3xl font-bold text-red-500 mb-1">
                            {analysisResults.breakdown?.red || 0}
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">Red Users</div>
                          <div className="text-xs font-semibold text-red-600">0-39 PTP</div>
                          <div className="text-xs text-muted-foreground mt-1">Re-engagement</div>
                        </div>
                      </div>
                    </div>

                    {/* AI Strategy */}
                    {analysisResults.aiStrategy && (
                      <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          AI Targeting Strategy
                        </h4>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                          {analysisResults.aiStrategy}
                        </p>
                      </div>
                    )}

                    {/* Performance Metrics */}
                    <div className="p-4 bg-muted/50 border border-border rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Campaign Performance
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Min PTP Score</div>
                          <div className="text-2xl font-bold text-primary">{analysisResults.minPtpScore || 0}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Budget Tier</div>
                          <div className="text-lg font-semibold capitalize">{budgetTier}</div>
                        </div>
                      </div>
                    </div>
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
  );
};
