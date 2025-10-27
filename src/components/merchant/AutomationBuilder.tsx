import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutomationCanvas } from "./AutomationCanvas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Node, Edge } from "reactflow";

interface AutomationBuilderProps {
  automationId?: string;
  isNew: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const AutomationBuilder = ({ 
  automationId, 
  isNew, 
  onClose, 
  onSave 
}: AutomationBuilderProps) => {
  const [automation, setAutomation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('canvas');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew && automationId) {
      loadAutomation();
    } else {
      setAutomation({
        name: 'Untitled Automation',
        description: '',
        trigger_type: 'manual',
        is_active: false,
        steps: []
      });
    }
  }, [automationId, isNew]);

  const loadAutomation = async () => {
    if (!automationId) return;

    const { data, error } = await supabase
      .from('automation_sequences')
      .select('*')
      .eq('id', automationId)
      .single();

    if (error) {
      toast.error('Failed to load automation');
      return;
    }

    setAutomation(data);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const automationData = {
        ...automation,
        steps: nodes.map((node, index) => ({
          ...node.data,
          type: node.id.split('-')[0],
          position: node.position,
          id: node.id,
        }))
      };

      if (isNew) {
        const { error } = await supabase
          .from('automation_sequences')
          .insert(automationData);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('automation_sequences')
          .update(automationData)
          .eq('id', automationId);

        if (error) throw error;
      }

      toast.success('Automation saved successfully');
      onSave();
    } catch (error) {
      console.error('Error saving automation:', error);
      toast.error('Failed to save automation');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!automationId) return;

    const newStatus = !automation?.is_active;

    const { error } = await supabase
      .from('automation_sequences')
      .update({ is_active: newStatus })
      .eq('id', automationId);

    if (error) {
      toast.error('Failed to update status');
      return;
    }

    setAutomation({ ...automation, is_active: newStatus });
    toast.success(newStatus ? 'Automation activated' : 'Automation deactivated');
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-4 flex items-center justify-between bg-background">
        <div className="flex-1">
          <Input
            value={automation?.name || 'Untitled Automation'}
            onChange={(e) => setAutomation({ ...automation, name: e.target.value })}
            className="text-2xl font-bold border-none p-0 h-auto"
          />
          <Input
            value={automation?.description || ''}
            onChange={(e) => setAutomation({ ...automation, description: e.target.value })}
            placeholder="Add a description..."
            className="text-sm text-muted-foreground border-none p-0 h-auto mt-1"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
          {!isNew && (
            <Button onClick={handleActivate}>
              {automation?.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="px-4">
          <TabsTrigger value="canvas">Canvas</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="canvas" className="flex-1 p-0 m-0">
          <AutomationCanvas
            automationId={automationId}
            initialNodes={nodes}
            initialEdges={edges}
            onNodesChange={setNodes}
            onEdgesChange={setEdges}
          />
        </TabsContent>

        <TabsContent value="settings" className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Trigger Type</label>
              <p className="text-sm text-muted-foreground">
                {automation?.trigger_type || 'manual'}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
