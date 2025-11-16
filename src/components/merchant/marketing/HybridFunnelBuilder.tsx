import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Mail, MessageSquare, BellRing, Smartphone } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const HybridFunnelBuilder = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [activating, setActivating] = useState(false);

  // Form state
  const [goalName, setGoalName] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [budgetTier, setBudgetTier] = useState<"minimal" | "moderate" | "aggressive">("moderate");
  
  // Channel toggles
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [inboxEnabled, setInboxEnabled] = useState(true);
  const [popupEnabled, setPopupEnabled] = useState(true);

  // Generated sequence
  const [generatedSequence, setGeneratedSequence] = useState<any>(null);

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
            latitude: 40.7128,
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

  const handleActivateSequence = async () => {
    setActivating(true);

    try {
      // Create marketing goal
      const { data: user } = await supabase.auth.getUser();
      
      const { data: goal, error: goalError } = await supabase
        .from("marketing_goals")
        .insert({
          merchant_id: user.user?.id,
          goal_name: goalName || goalDescription.substring(0, 50),
          goal_type: "custom",
          desired_conversion: "purchase",
          target_audience_filter: { description: targetAudience }
        })
        .select()
        .single();

      if (goalError) throw goalError;

      // Create adaptive sequence
      const { error: sequenceError } = await supabase
        .from("adaptive_sequences")
        .insert({
          goal_id: goal.id,
          sequence_name: generatedSequence.goal || "Adaptive Sequence",
          decision_tree: generatedSequence,
          fatigue_rules: generatedSequence.fatigue_rules,
          is_active: true
        });

      if (sequenceError) throw sequenceError;

      toast({
        title: "Sequence activated!",
        description: "Your adaptive marketing funnel is now running"
      });

      // Reset form
      setStep(1);
      setGoalName("");
      setGoalDescription("");
      setTargetAudience("");
      setGeneratedSequence(null);

    } catch (error: any) {
      console.error("Error activating sequence:", error);
      toast({
        title: "Activation failed",
        description: error.message || "Failed to activate sequence",
        variant: "destructive"
      });
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">AI Hybrid Funnel Builder</h2>
          <p className="text-sm text-muted-foreground">
            Create adaptive multi-channel sequences with AI
          </p>
        </div>
      </div>

      {step === 1 && (
        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="goalName">Campaign Name (Optional)</Label>
              <Input
                id="goalName"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="NYC Hats Summer Sale"
              />
            </div>

            <div>
              <Label htmlFor="goalDescription">What do you want to achieve?</Label>
              <Textarea
                id="goalDescription"
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder="Sell 100 NYC hats to users who viewed hats but didn't purchase"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="targetAudience">Who should receive this?</Label>
              <Textarea
                id="targetAudience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Users who clicked on NYC hats in the last 7 days but didn't buy"
                rows={2}
              />
            </div>

            <div>
              <Label>Budget Tier</Label>
              <RadioGroup value={budgetTier} onValueChange={(v: any) => setBudgetTier(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="minimal" id="minimal" />
                  <Label htmlFor="minimal">Minimal - Email only, fewer touchpoints</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label htmlFor="moderate">Moderate - Email + SMS, balanced approach</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="aggressive" id="aggressive" />
                  <Label htmlFor="aggressive">Aggressive - All 4 channels, maximum reach</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Enabled Channels</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                  <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span>SMS</span>
                  </div>
                  <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Inbox</span>
                  </div>
                  <Switch checked={inboxEnabled} onCheckedChange={setInboxEnabled} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4" />
                    <span>Pop-Up</span>
                  </div>
                  <Switch checked={popupEnabled} onCheckedChange={setPopupEnabled} />
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleGenerateSequence}
            disabled={generating}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating with AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Adaptive Sequence
              </>
            )}
          </Button>
        </Card>
      )}

      {step === 2 && generatedSequence && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Generated Sequence</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {generatedSequence.goal}
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Decision Tree Overview</h4>
                <p className="text-sm">
                  Total Nodes: {Object.keys(generatedSequence.nodes || {}).length}
                </p>
                <p className="text-sm">
                  Entry Point: {generatedSequence.entry_node}
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Fatigue Prevention</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Max Email: {generatedSequence.fatigue_rules?.max_email_24h}/24h</div>
                  <div>Max SMS: {generatedSequence.fatigue_rules?.max_sms_72h}/72h</div>
                  <div>Max Inbox: {generatedSequence.fatigue_rules?.max_inbox_48h}/48h</div>
                  <div>Max Popup: {generatedSequence.fatigue_rules?.max_popup_72h}/72h</div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">First Steps</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(generatedSequence.nodes || {}).slice(0, 3).map(([key, node]: [string, any]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="font-medium">{key}:</span>
                      <span>{node.type} - {node.subject || node.message?.substring(0, 50)}...</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back to Edit
            </Button>
            <Button
              onClick={handleActivateSequence}
              disabled={activating}
              className="flex-1"
            >
              {activating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                "Activate Sequence"
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};