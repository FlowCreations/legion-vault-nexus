import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Sparkles, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface SMSCampaignWizardProps {
  onClose: () => void;
}

export const SMSCampaignWizard = ({ onClose }: SMSCampaignWizardProps) => {
  const [campaignName, setCampaignName] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [targetSegment, setTargetSegment] = useState("");
  const [useAI, setUseAI] = useState(true);

  const characterCount = messageBody.length;
  const segmentCount = Math.ceil(characterCount / 160);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Create SMS Campaign
          </DialogTitle>
          <DialogDescription>
            Design an SMS campaign that works alongside your email strategy
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Twilio credentials required. Configure in Settings → Integrations to enable SMS sending.
          </AlertDescription>
        </Alert>

        <div className="space-y-6 py-4">
          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              placeholder="e.g., New Album Launch SMS"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
            />
          </div>

          {/* Target Segment */}
          <div className="space-y-2">
            <Label htmlFor="target-segment">Target Segment</Label>
            <Select value={targetSegment} onValueChange={setTargetSegment}>
              <SelectTrigger>
                <SelectValue placeholder="Select a segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-opted-in">All SMS Subscribers</SelectItem>
                <SelectItem value="high-ptp">High PTP (67+)</SelectItem>
                <SelectItem value="engaged-fans">Engaged Fans</SelectItem>
                <SelectItem value="vip">VIP Fans</SelectItem>
                <SelectItem value="new-subscribers">New Subscribers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AI Assist Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label htmlFor="ai-assist">AI Message Generation</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Let AI personalize messages based on user personality and behavior
              </p>
            </div>
            <Switch
              id="ai-assist"
              checked={useAI}
              onCheckedChange={setUseAI}
            />
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message-body">Message</Label>
              <span className="text-xs text-muted-foreground">
                {characterCount}/160 chars • {segmentCount} segment{segmentCount !== 1 ? 's' : ''}
              </span>
            </div>
            <Textarea
              id="message-body"
              placeholder="Hey {first_name}, I just dropped something new and I think you'll love it. Check it out: {link}"
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Use {'{first_name}'}, {'{link}'}, and other variables for personalization
            </p>
          </div>

          {/* SMS Preview */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Preview</p>
            <div className="bg-background rounded-lg p-3 max-w-[280px]">
              <p className="text-sm">
                {messageBody || "Your message will appear here..."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled>
            Create Campaign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
