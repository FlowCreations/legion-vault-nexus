import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Zap, Loader2, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export const AutomationRulesBuilder = () => {
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    trigger_type: "ptp_score",
    trigger_conditions: { ptp_min: 67 },
    action_type: "send_email",
    action_config: {
      subject: "",
      email_body: "",
    },
    priority: 5,
    is_active: true,
    max_sends_per_user: 1,
    cooldown_hours: 24,
  });

  const saveRule = async () => {
    try {
      setSaving(true);

      // Use the edge function to create automation rules
      const { error } = await supabase.functions.invoke("process-automation-rules", {
        body: { action: "create", rule: newRule }
      });

      if (error) throw error;

      toast({
        title: "Rule Created",
        description: "Your automation rule has been saved successfully.",
      });

      // Reset form
      setNewRule({
        name: "",
        description: "",
        trigger_type: "ptp_score",
        trigger_conditions: { ptp_min: 67 },
        action_type: "send_email",
        action_config: {
          subject: "",
          email_body: "",
        },
        priority: 5,
        is_active: true,
        max_sends_per_user: 1,
        cooldown_hours: 24,
      });

      setCreating(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Create Automation Rule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!creating ? (
            <Button onClick={() => setCreating(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              New Automation Rule
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="High PTP Score Conversion"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Send exclusive discount to high-intent users"
                />
              </div>

              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select
                  value={newRule.trigger_type}
                  onValueChange={(value) => setNewRule({ ...newRule, trigger_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ptp_score">PTP Score Threshold</SelectItem>
                    <SelectItem value="era_label">ERA Label</SelectItem>
                    <SelectItem value="abandoned_cart">Abandoned Cart</SelectItem>
                    <SelectItem value="behavior_pattern">Behavior Pattern</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newRule.trigger_type === "ptp_score" && (
                <div className="space-y-2">
                  <Label>Minimum PTP Score</Label>
                  <Input
                    type="number"
                    value={(newRule.trigger_conditions as any).ptp_min || 67}
                    onChange={(e) =>
                      setNewRule({
                        ...newRule,
                        trigger_conditions: { ptp_min: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Email Subject</Label>
                <Input
                  value={newRule.action_config.subject}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      action_config: { ...newRule.action_config, subject: e.target.value },
                    })
                  }
                  placeholder="Exclusive Offer Just for You!"
                />
              </div>

              <div className="space-y-2">
                <Label>Email Body</Label>
                <Textarea
                  value={newRule.action_config.email_body}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      action_config: { ...newRule.action_config, email_body: e.target.value },
                    })
                  }
                  placeholder="Hi {{user_name}}, we noticed you're really engaged..."
                  rows={6}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={newRule.is_active}
                  onCheckedChange={(checked) => setNewRule({ ...newRule, is_active: checked })}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={saveRule} disabled={saving} className="flex-1">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Rule
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};