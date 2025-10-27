import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Mail, Clock, GitBranch, Zap, Target } from 'lucide-react';
import { AutomationStepType } from '@/types/automation';

interface AutomationCanvasProps {
  automationId?: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
}

export const AutomationCanvas = ({ 
  automationId,
  initialNodes = [],
  initialEdges = [],
  onNodesChange: onNodesChangeProp,
  onEdgesChange: onEdgesChangeProp
}: AutomationCanvasProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, edges);
      setEdges(newEdges);
      onEdgesChangeProp?.(newEdges);
    },
    [edges, setEdges, onEdgesChangeProp]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const getDefaultStepData = (stepType: AutomationStepType) => {
    switch (stepType) {
      case 'email':
        return {
          label: 'Send Email',
          subject: '',
          body: '',
          sendTimeOptimization: false
        };
      case 'delay':
        return {
          label: 'Wait',
          delayValue: 1,
          delayUnit: 'days'
        };
      case 'condition':
        return {
          label: 'If/Then',
          conditionType: 'email_opened',
          operator: 'equals',
          value: true
        };
      case 'action':
        return {
          label: 'Action',
          actionType: 'add_to_list'
        };
      case 'goal':
        return {
          label: 'Goal',
          goalType: 'purchase'
        };
      default:
        return { label: 'Step' };
    }
  };

  const addNewStep = (stepType: AutomationStepType) => {
    const newNode: Node = {
      id: `${stepType}-${Date.now()}`,
      type: 'default',
      position: { x: 250, y: nodes.length * 150 },
      data: getDefaultStepData(stepType)
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    onNodesChangeProp?.(newNodes);
  };

  const nodeColor = (node: Node) => {
    if (!node.type) return '#ddd';
    
    const id = node.id.split('-')[0];
    switch (id) {
      case 'email': return '#10b981';
      case 'delay': return '#f59e0b';
      case 'condition': return '#8b5cf6';
      case 'action': return '#3b82f6';
      case 'goal': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="h-[600px] border rounded-lg bg-background">
      <div className="flex gap-2 p-2 border-b bg-muted/20">
        <Button size="sm" variant="outline" onClick={() => addNewStep('email')}>
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
        <Button size="sm" variant="outline" onClick={() => addNewStep('delay')}>
          <Clock className="h-4 w-4 mr-2" />
          Delay
        </Button>
        <Button size="sm" variant="outline" onClick={() => addNewStep('condition')}>
          <GitBranch className="h-4 w-4 mr-2" />
          Condition
        </Button>
        <Button size="sm" variant="outline" onClick={() => addNewStep('action')}>
          <Zap className="h-4 w-4 mr-2" />
          Action
        </Button>
        <Button size="sm" variant="outline" onClick={() => addNewStep('goal')}>
          <Target className="h-4 w-4 mr-2" />
          Goal
        </Button>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap nodeColor={nodeColor} />
      </ReactFlow>
    </div>
  );
};
