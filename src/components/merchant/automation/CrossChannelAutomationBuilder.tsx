import { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, MessageSquare, Clock, GitBranch, Play, Save, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EmailStepNode } from "./nodes/EmailStepNode";
import { SMSStepNode } from "./nodes/SMSStepNode";
import { WaitStepNode } from "./nodes/WaitStepNode";
import { ConditionStepNode } from "./nodes/ConditionStepNode";
import { StepConfigDialog } from "./StepConfigDialog";

const nodeTypes = {
  emailStep: EmailStepNode,
  smsStep: SMSStepNode,
  waitStep: WaitStepNode,
  conditionStep: ConditionStepNode,
};

interface CrossChannelAutomationBuilderProps {
  automationId?: string;
  onClose: () => void;
}

export const CrossChannelAutomationBuilder = ({ automationId, onClose }: CrossChannelAutomationBuilderProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [automationName, setAutomationName] = useState("");
  const [automationDescription, setAutomationDescription] = useState("");
  const [triggerType, setTriggerType] = useState("signup");
  const [isActive, setIsActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showStepConfig, setShowStepConfig] = useState(false);
  const [selectedStepType, setSelectedStepType] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const { toast } = useToast();

  // Load automation if editing
  useEffect(() => {
    if (automationId) {
      loadAutomation();
    }
  }, [automationId]);

  const loadAutomation = async () => {
    const { data, error } = await supabase
      .from("automation_sequences")
      .select("*")
      .eq("id", automationId)
      .single();

    if (error) {
      toast({ title: "Error loading automation", variant: "destructive" });
      return;
    }

    if (data) {
      setAutomationName(data.name);
      setAutomationDescription(data.description || "");
      setTriggerType(data.trigger_type);
      setIsActive(data.is_active);

      // Convert steps to ReactFlow nodes and edges
      const steps = Array.isArray(data.steps) ? data.steps : [];
      const flowNodes = convertStepsToNodes(steps);
      const flowEdges = convertStepsToEdges(steps);
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  };

  const convertStepsToNodes = (steps: any[]): Node[] => {
    return steps.map((step, index) => ({
      id: `node-${index}`,
      type: step.type === "email" ? "emailStep" : 
            step.type === "sms" ? "smsStep" :
            step.type === "wait" ? "waitStep" : "conditionStep",
      position: { x: 100, y: 100 + index * 150 },
      data: { ...step, onEdit: () => handleEditNode(`node-${index}`) },
    }));
  };

  const convertStepsToEdges = (steps: any[]): Edge[] => {
    const edges: Edge[] = [];
    steps.forEach((step, index) => {
      if (index < steps.length - 1) {
        edges.push({
          id: `edge-${index}`,
          source: `node-${index}`,
          target: `node-${index + 1}`,
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      }
      // Handle conditional branches
      if (step.branches) {
        step.branches.forEach((branch: any, branchIndex: number) => {
          edges.push({
            id: `edge-${index}-branch-${branchIndex}`,
            source: `node-${index}`,
            target: branch.nextNodeId,
            label: branch.condition,
            markerEnd: { type: MarkerType.ArrowClosed },
          });
        });
      }
    });
    return edges;
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges]
  );

  const addStep = (stepType: string) => {
    setSelectedStepType(stepType);
    setShowStepConfig(true);
  };

  const handleStepConfigSave = (config: any) => {
    const newNode: Node = {
      id: `node-${nodes.length}`,
      type: selectedStepType === "email" ? "emailStep" :
            selectedStepType === "sms" ? "smsStep" :
            selectedStepType === "wait" ? "waitStep" : "conditionStep",
      position: { x: 100, y: 100 + nodes.length * 150 },
      data: { ...config, onEdit: () => handleEditNode(`node-${nodes.length}`) },
    };

    if (editingNode) {
      setNodes((nds) => nds.map((node) => 
        node.id === editingNode.id ? { ...node, data: { ...config, onEdit: () => handleEditNode(editingNode.id) } } : node
      ));
    } else {
      setNodes((nds) => [...nds, newNode]);
    }

    setShowStepConfig(false);
    setEditingNode(null);
    setSelectedStepType(null);
  };

  const handleEditNode = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setEditingNode(node);
      setSelectedStepType(node.type.replace("Step", ""));
      setShowStepConfig(true);
    }
  };

  const handleSave = async () => {
    if (!automationName) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }

    setSaving(true);

    // Convert ReactFlow nodes back to steps array
    const steps = nodes.map((node) => ({
      type: node.type.replace("Step", ""),
      ...node.data,
    }));

    const automationData = {
      name: automationName,
      description: automationDescription,
      trigger_type: triggerType,
      trigger_rules: {},
      steps,
      is_active: isActive,
    };

    try {
      if (automationId) {
        const { error } = await supabase
          .from("automation_sequences")
          .update(automationData)
          .eq("id", automationId);

        if (error) throw error;
        toast({ title: "Automation updated" });
      } else {
        const { error } = await supabase
          .from("automation_sequences")
          .insert(automationData);

        if (error) throw error;
        toast({ title: "Automation created" });
      }

      onClose();
    } catch (error) {
      console.error("Error saving automation:", error);
      toast({ title: "Error saving automation", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full">
        <DialogHeader>
          <DialogTitle>Cross-Channel Automation Builder</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4 h-full">
          {/* Left Sidebar - Configuration */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Automation Name</Label>
                <Input
                  value={automationName}
                  onChange={(e) => setAutomationName(e.target.value)}
                  placeholder="e.g., Welcome Series"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={automationDescription}
                  onChange={(e) => setAutomationDescription(e.target.value)}
                  placeholder="Brief description"
                />
              </div>

              <div className="space-y-2">
                <Label>Add Steps</Label>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => addStep("email")}
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => addStep("sms")}
                  >
                    <MessageSquare className="h-4 w-4" />
                    SMS
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => addStep("wait")}
                  >
                    <Clock className="h-4 w-4" />
                    Wait
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => addStep("condition")}
                  >
                    <GitBranch className="h-4 w-4" />
                    Condition
                  </Button>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Automation"}
                </Button>
                <Button
                  variant={isActive ? "destructive" : "default"}
                  onClick={() => setIsActive(!isActive)}
                  className="w-full gap-2"
                >
                  <Play className="h-4 w-4" />
                  {isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Canvas - ReactFlow */}
          <div className="col-span-3 border rounded-lg bg-background">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>
        </div>

        {showStepConfig && (
          <StepConfigDialog
            stepType={selectedStepType || "email"}
            initialData={editingNode?.data}
            onSave={handleStepConfigSave}
            onClose={() => {
              setShowStepConfig(false);
              setEditingNode(null);
              setSelectedStepType(null);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
