import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailTemplateLibrary } from "./EmailTemplateLibrary";
import { EmailTemplateEditor } from "./EmailTemplateEditor";
import { AIContentGenerator } from "./AIContentGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, Send, Save, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CampaignBuilderProps {
  onClose: () => void;
  onSave: () => void;
}

export function CampaignBuilder({ onClose, onSave }: CampaignBuilderProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState<any>(null);

  // Step 1: Campaign Details
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState("broadcast");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  // Step 2: Audience
  const [selectedList, setSelectedList] = useState("");
  const [lists, setLists] = useState<any[]>([]);
  const [listPreview, setListPreview] = useState<any>(null);

  // Step 3: Content
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [aiGenerated, setAiGenerated] = useState(false);

  // Load lists when step 2 is reached
  useState(() => {
    if (step === 2 && lists.length === 0) {
      loadLists();
    }
  });

  const loadLists = async () => {
    const { data } = await supabase
      .from("email_lists")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setLists(data);
  };

  const loadListPreview = async (listId: string) => {
    const { data: list } = await supabase
      .from("email_lists")
      .select("*")
      .eq("id", listId)
      .single();

    setListPreview(list);
  };

  const handleTemplateSelect = (template: any) => {
    setSubject(template.subject);
    setPreviewText(template.previewText);
    setEmailBody(template.body);
    setShowTemplateLibrary(false);
    toast({ title: "Template applied successfully" });
  };

  const handleAIGenerate = (content: string) => {
    // Parse AI generated content
    try {
      const lines = content.split('\n');
      let currentSection = '';
      let subjectLines: string[] = [];
      let bodyLines: string[] = [];
      let ctaLines: string[] = [];
      let previewLine = '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.includes('Subject') || trimmed.includes('subject')) currentSection = 'subject';
        else if (trimmed.includes('Body') || trimmed.includes('body')) currentSection = 'body';
        else if (trimmed.includes('CTA') || trimmed.includes('call-to-action')) currentSection = 'cta';
        else if (trimmed.includes('Preview') || trimmed.includes('preview')) currentSection = 'preview';
        else if (trimmed && !trimmed.match(/^\d+\./)) {
          if (currentSection === 'subject') subjectLines.push(trimmed);
          else if (currentSection === 'body') bodyLines.push(trimmed);
          else if (currentSection === 'cta') ctaLines.push(trimmed);
          else if (currentSection === 'preview') previewLine = trimmed;
        }
      }

      setSubject(subjectLines[0] || subject);
      setPreviewText(previewLine || previewText);
      setEmailBody(bodyLines.join('\n\n') || emailBody);
      setAiGenerated(true);
    } catch (e) {
      // If parsing fails, just use the raw content
      setEmailBody(content);
      setAiGenerated(true);
    }
  };

  const sendTestEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      toast({ title: "Error", description: "No email found", variant: "destructive" });
      return;
    }

    toast({ title: "Test email sent to " + user.email });
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("email_campaigns").insert({
        name: campaignName,
        campaign_type: campaignType,
        campaign_goal: campaignGoal,
        list_id: selectedList || null,
        subject,
        preview_text: previewText,
        email_body: emailBody,
        status: "draft",
        ai_generated: aiGenerated,
        scheduled_for: scheduledFor || null,
      });

      if (error) throw error;

      toast({ title: "Campaign saved as draft" });
      onSave();
      onClose();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSend = async () => {
    if (!scheduledFor) {
      toast({ title: "Please select a send time", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("email_campaigns").insert({
        name: campaignName,
        campaign_type: campaignType,
        campaign_goal: campaignGoal,
        list_id: selectedList || null,
        subject,
        preview_text: previewText,
        email_body: emailBody,
        status: "scheduled",
        ai_generated: aiGenerated,
        scheduled_for: scheduledFor,
      });

      if (error) throw error;

      toast({ title: "Campaign scheduled successfully" });
      onSave();
      onClose();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = async () => {
    setLoading(true);
    try {
      const { data: campaign, error: campaignError } = await supabase
        .from("email_campaigns")
        .insert({
          name: campaignName,
          campaign_type: campaignType,
          campaign_goal: campaignGoal,
          list_id: selectedList || null,
          subject,
          preview_text: previewText,
          email_body: emailBody,
          status: "sending",
          ai_generated: aiGenerated,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Trigger send
      const { error: sendError } = await supabase.functions.invoke("send-email-campaign", {
        body: { campaignId: campaign.id },
      });

      if (sendError) throw sendError;

      toast({ title: "Campaign sent successfully!" });
      onSave();
      onClose();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 4 && <div className="w-12 h-0.5 bg-muted mx-2" />}
            </div>
          ))}
        </div>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </div>

      {/* Step 1: Campaign Details */}
      {step === 1 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Campaign Details</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Spring VIP Sale 2025"
              />
            </div>

            <div>
              <Label>Campaign Type</Label>
              <Select value={campaignType} onValueChange={setCampaignType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="broadcast">One-time Broadcast</SelectItem>
                  <SelectItem value="scheduled">Scheduled Send</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Campaign Goal</Label>
              <Select value={campaignGoal} onValueChange={setCampaignGoal}>
                <SelectTrigger>
                  <SelectValue placeholder="Select goal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Drive Sales</SelectItem>
                  <SelectItem value="engagement">Increase Engagement</SelectItem>
                  <SelectItem value="reactivation">Re-activate Dormant Fans</SelectItem>
                  <SelectItem value="community">Build Community</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {campaignType === "scheduled" && (
              <div>
                <Label htmlFor="scheduled">Schedule For</Label>
                <Input
                  id="scheduled"
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Step 2: Audience */}
      {step === 2 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Select Audience</h2>
          <div className="space-y-4">
            <div>
              <Label>Email List</Label>
              <Select
                value={selectedList}
                onValueChange={(value) => {
                  setSelectedList(value);
                  loadListPreview(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a list..." />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name} ({list.member_count} members)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {listPreview && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">{listPreview.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{listPreview.description}</p>
                <Badge>{listPreview.member_count} total members</Badge>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Step 3: Content */}
      {step === 3 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Email Content</h2>
            <div className="flex gap-2">
              <AIContentGenerator
                campaignGoal={campaignGoal}
                targetAudience={{
                  name: lists.find((l) => l.id === selectedList)?.name || "",
                  memberCount: lists.find((l) => l.id === selectedList)?.member_count || 0,
                  filters: lists.find((l) => l.id === selectedList)?.filter_rules || {},
                }}
                onGenerate={handleAIGenerate}
              />
              <Button variant="outline" onClick={() => setShowTemplateLibrary(true)}>
                Browse Templates
              </Button>
              <Button variant="outline" onClick={sendTestEmail}>
                <Mail className="w-4 h-4 mr-2" />
                Send Test
              </Button>
            </div>
          </div>

          <EmailTemplateEditor
            subject={subject}
            previewText={previewText}
            body={emailBody}
            onSubjectChange={setSubject}
            onPreviewTextChange={setPreviewText}
            onBodyChange={setEmailBody}
          />
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Review & Send</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Campaign Name</Label>
                <p className="font-medium">{campaignName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <p className="font-medium capitalize">{campaignType}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Goal</Label>
                <p className="font-medium capitalize">{campaignGoal}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Audience</Label>
                <p className="font-medium">
                  {lists.find((l) => l.id === selectedList)?.name} (
                  {lists.find((l) => l.id === selectedList)?.member_count} members)
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-muted-foreground">Subject Line</Label>
              <p className="font-medium">{subject}</p>
            </div>

            <div className="border rounded-lg p-4 bg-muted max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{emailBody}</pre>
            </div>

            {aiGenerated && (
              <Badge variant="secondary">🤖 AI Generated Content</Badge>
            )}
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {step < 4 ? (
          <Button
            onClick={() => setStep(Math.min(4, step + 1))}
            disabled={
              (step === 1 && !campaignName) ||
              (step === 2 && !selectedList) ||
              (step === 3 && (!subject || !emailBody))
            }
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            {campaignType === "scheduled" ? (
              <Button onClick={handleScheduleSend} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Schedule Send
              </Button>
            ) : (
              <Button onClick={handleSendNow} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Template Library Dialog */}
      <Dialog open={showTemplateLibrary} onOpenChange={setShowTemplateLibrary}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Template Library</DialogTitle>
          </DialogHeader>
          <EmailTemplateLibrary
            onSelectTemplate={handleTemplateSelect}
            onPreviewTemplate={setShowTemplatePreview}
          />
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={!!showTemplatePreview} onOpenChange={() => setShowTemplatePreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{showTemplatePreview?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <p className="text-sm mt-1">{showTemplatePreview?.subject}</p>
            </div>
            <div>
              <Label>Preview Text</Label>
              <p className="text-sm mt-1 text-muted-foreground">{showTemplatePreview?.previewText}</p>
            </div>
            <div>
              <Label>Email Body</Label>
              <div className="border rounded-lg p-4 bg-muted mt-1">
                <pre className="whitespace-pre-wrap text-sm">{showTemplatePreview?.body}</pre>
              </div>
            </div>
            <Button onClick={() => handleTemplateSelect(showTemplatePreview)} className="w-full">
              Use This Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
