import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bot, Save } from "lucide-react";

interface ChatbotTemplate {
  id?: string;
  message: string;
  link_url: string;
  link_text: string;
  interval_minutes: number;
  slot_number: number;
  active: boolean;
}

export const ChatbotManager = () => {
  const [templates, setTemplates] = useState<ChatbotTemplate[]>([
    { message: "", link_url: "", link_text: "", interval_minutes: 10, slot_number: 1, active: true },
    { message: "", link_url: "", link_text: "", interval_minutes: 10, slot_number: 2, active: true },
    { message: "", link_url: "", link_text: "", interval_minutes: 10, slot_number: 3, active: true },
    { message: "", link_url: "", link_text: "", interval_minutes: 10, slot_number: 4, active: true },
    { message: "", link_url: "", link_text: "", interval_minutes: 10, slot_number: 5, active: true },
  ]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from('chatbot_templates')
      .select('*')
      .order('slot_number');
    
    if (data && data.length > 0) {
      const loadedTemplates = [...templates];
      data.forEach((template) => {
        const index = template.slot_number - 1;
        if (index >= 0 && index < 5) {
          loadedTemplates[index] = template;
        }
      });
      setTemplates(loadedTemplates);
    }
  };

  const updateTemplate = (index: number, field: keyof ChatbotTemplate, value: any) => {
    const updated = [...templates];
    updated[index] = { ...updated[index], [field]: value };
    setTemplates(updated);
  };

  const saveTemplates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (const template of templates) {
      if (!template.message.trim()) continue;

      const data = {
        message: template.message,
        link_url: template.link_url,
        link_text: template.link_text,
        interval_minutes: template.interval_minutes,
        slot_number: template.slot_number,
        active: template.active,
        created_by: user.id,
      };

      if (template.id) {
        await supabase
          .from('chatbot_templates')
          .update(data)
          .eq('id', template.id);
      } else {
        await supabase
          .from('chatbot_templates')
          .insert(data);
      }
    }

    toast.success('Chatbot templates saved!');
    loadTemplates();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Bot className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Chatbot Message Manager</h2>
      </div>

      <div className="space-y-6">
        {templates.map((template, index) => (
          <Card key={index} className="p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Slot {index + 1}</h3>
              <div className="flex items-center gap-2">
                <Label>Active</Label>
                <Switch
                  checked={template.active}
                  onCheckedChange={(checked) => updateTemplate(index, 'active', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Message (max 230 characters)</Label>
                <Textarea
                  value={template.message}
                  onChange={(e) => updateTemplate(index, 'message', e.target.value)}
                  maxLength={230}
                  placeholder="🎸 Loving the show? Drop us a tip!"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {template.message.length}/230 characters
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Link URL (optional)</Label>
                  <Input
                    value={template.link_url}
                    onChange={(e) => updateTemplate(index, 'link_url', e.target.value)}
                    placeholder="https://..."
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Link Text (optional)</Label>
                  <Input
                    value={template.link_text}
                    onChange={(e) => updateTemplate(index, 'link_text', e.target.value)}
                    placeholder="Click here"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label>Interval (minutes)</Label>
                <Input
                  type="number"
                  value={template.interval_minutes}
                  onChange={(e) => updateTemplate(index, 'interval_minutes', parseInt(e.target.value))}
                  min={1}
                  max={60}
                  className="mt-2"
                />
              </div>
            </div>
          </Card>
        ))}

        <Button onClick={saveTemplates} size="lg" className="w-full gap-2">
          <Save className="w-5 h-5" />
          Save All Templates
        </Button>
      </div>
    </Card>
  );
};