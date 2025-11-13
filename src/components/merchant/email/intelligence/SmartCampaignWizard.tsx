import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Loader2, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const SmartCampaignWizard = () => {
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const [campaign, setCampaign] = useState({
    name: "",
    objective: "engagement",
    subject: "",
    email_body: "",
    target_segment: {
      ptp_min: 0,
      ptp_max: 100,
      era_labels: [] as string[],
    },
  });

  const generateContent = async () => {
    try {
      setGenerating(true);

      const { data, error } = await supabase.functions.invoke("generate-email-content", {
        body: {
          campaignGoal: campaign.objective,
          targetAudience: `PTP: ${campaign.target_segment.ptp_min}-${campaign.target_segment.ptp_max}`,
          tone: "casual",
          includeOffer: true,
        },
      });

      if (error) throw error;

      setCampaign({
        ...campaign,
        subject: data.subject || "",
        email_body: data.body || "",
      });

      toast({
        title: "Content Generated",
        description: "AI has created personalized email content for your campaign.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const sendCampaign = async () => {
    try {
      setSending(true);

      // Create campaign in database
      const { data: newCampaign, error: createError } = await supabase
        .from("email_campaigns")
        .insert([
          {
            name: campaign.name,
            subject: campaign.subject,
            email_body: campaign.email_body,
            objective: campaign.objective,
            target_segment: campaign.target_segment,
            status: "sending",
            send_immediately: true,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;

      // Trigger immediate send
      const { error: sendError } = await supabase.functions.invoke("send-campaign-immediate", {
        body: { campaignId: newCampaign.id },
      });

      if (sendError) throw sendError;

      toast({
        title: "Campaign Sent",
        description: "Your campaign is being sent to the target audience.",
      });

      // Reset form
      setCampaign({
        name: "",
        objective: "engagement",
        subject: "",
        email_body: "",
        target_segment: {
          ptp_min: 0,
          ptp_max: 100,
          era_labels: [],
        },
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Quick Campaign Generator
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Generate AI-powered email content based on your campaign goals
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Campaign Name</Label>
            <Input
              value={campaign.name}
              onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
              placeholder="Summer Engagement Campaign"
            />
          </div>

          <div className="space-y-2">
            <Label>Campaign Objective</Label>
            <Select
              value={campaign.objective}
              onValueChange={(value) => setCampaign({ ...campaign, objective: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="conversion">Conversion</SelectItem>
                <SelectItem value="retention">Retention</SelectItem>
                <SelectItem value="reactivation">Reactivation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min PTP Score</Label>
              <Input
                type="number"
                value={campaign.target_segment.ptp_min}
                onChange={(e) =>
                  setCampaign({
                    ...campaign,
                    target_segment: {
                      ...campaign.target_segment,
                      ptp_min: parseInt(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Max PTP Score</Label>
              <Input
                type="number"
                value={campaign.target_segment.ptp_max}
                onChange={(e) =>
                  setCampaign({
                    ...campaign,
                    target_segment: {
                      ...campaign.target_segment,
                      ptp_max: parseInt(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>

          <Button onClick={generateContent} disabled={generating} className="w-full">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating AI Content...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate AI Content
              </>
            )}
          </Button>

          {campaign.subject && (
            <>
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  value={campaign.subject}
                  onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Email Body</Label>
                <Textarea
                  value={campaign.email_body}
                  onChange={(e) => setCampaign({ ...campaign, email_body: e.target.value })}
                  rows={10}
                />
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary">Uses AI personalization</Badge>
                <Badge variant="outline">Variables: user_name, ptp_score, era_label</Badge>
              </div>

              <Button onClick={sendCampaign} disabled={sending} className="w-full">
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Campaign...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Campaign Now
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};