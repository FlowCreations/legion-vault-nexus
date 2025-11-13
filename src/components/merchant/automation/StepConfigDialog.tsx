import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StepConfigDialogProps {
  stepType: string;
  initialData?: any;
  onSave: (config: any) => void;
  onClose: () => void;
}

export const StepConfigDialog = ({ stepType, initialData, onSave, onClose }: StepConfigDialogProps) => {
  const [config, setConfig] = useState(initialData || {});

  useEffect(() => {
    if (initialData) {
      setConfig(initialData);
    }
  }, [initialData]);

  const handleSave = () => {
    onSave(config);
  };

  const renderEmailConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Subject Line</Label>
        <Input
          value={config.subject || ""}
          onChange={(e) => setConfig({ ...config, subject: e.target.value })}
          placeholder="Enter email subject"
        />
      </div>
      <div className="space-y-2">
        <Label>Email Body</Label>
        <Textarea
          value={config.body || ""}
          onChange={(e) => setConfig({ ...config, body: e.target.value })}
          placeholder="Enter email content"
          rows={6}
        />
      </div>
      <div className="space-y-2">
        <Label>Delay (hours)</Label>
        <Input
          type="number"
          value={config.delay_hours || 0}
          onChange={(e) => setConfig({ ...config, delay_hours: parseInt(e.target.value) })}
          placeholder="0"
        />
      </div>
    </div>
  );

  const renderSMSConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>SMS Message</Label>
        <Textarea
          value={config.body || ""}
          onChange={(e) => setConfig({ ...config, body: e.target.value })}
          placeholder="Enter SMS message (max 160 characters)"
          rows={4}
          maxLength={160}
        />
        <p className="text-xs text-muted-foreground">{config.body?.length || 0}/160 characters</p>
      </div>
      <div className="space-y-2">
        <Label>Delay (hours)</Label>
        <Input
          type="number"
          value={config.delay_hours || 0}
          onChange={(e) => setConfig({ ...config, delay_hours: parseInt(e.target.value) })}
          placeholder="0"
        />
      </div>
    </div>
  );

  const renderWaitConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Wait Duration (hours)</Label>
        <Input
          type="number"
          value={config.delay_hours || 0}
          onChange={(e) => setConfig({ ...config, delay_hours: parseInt(e.target.value) })}
          placeholder="0"
        />
      </div>
      <div className="space-y-2">
        <Label>Wait Duration (days)</Label>
        <Input
          type="number"
          value={config.delay_days || 0}
          onChange={(e) => setConfig({ ...config, delay_days: parseInt(e.target.value) })}
          placeholder="0"
        />
      </div>
    </div>
  );

  const renderConditionConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Condition Type</Label>
        <Select
          value={config.condition_type || "email_opened"}
          onValueChange={(value) => setConfig({ ...config, condition_type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email_opened">Email Opened</SelectItem>
            <SelectItem value="email_clicked">Email Clicked</SelectItem>
            <SelectItem value="email_not_opened">Email Not Opened</SelectItem>
            <SelectItem value="sms_clicked">SMS Clicked</SelectItem>
            <SelectItem value="purchased">Made Purchase</SelectItem>
            <SelectItem value="ptp_score">PTP Score</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {config.condition_type === "ptp_score" && (
        <div className="space-y-2">
          <Label>PTP Score Threshold</Label>
          <Input
            type="number"
            value={config.condition_value || 67}
            onChange={(e) => setConfig({ ...config, condition_value: parseInt(e.target.value) })}
            placeholder="67"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label>Wait Time (hours) before checking</Label>
        <Input
          type="number"
          value={config.wait_hours || 24}
          onChange={(e) => setConfig({ ...config, wait_hours: parseInt(e.target.value) })}
          placeholder="24"
        />
      </div>
    </div>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure {stepType.toUpperCase()} Step</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {stepType === "email" && renderEmailConfig()}
          {stepType === "sms" && renderSMSConfig()}
          {stepType === "wait" && renderWaitConfig()}
          {stepType === "condition" && renderConditionConfig()}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Step</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
