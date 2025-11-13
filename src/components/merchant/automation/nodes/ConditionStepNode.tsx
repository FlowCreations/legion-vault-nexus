import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Card } from "@/components/ui/card";
import { GitBranch, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ConditionStepNode = memo(({ data }: any) => {
  return (
    <Card className="w-64 shadow-lg border-purple-500">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-purple-500" />
            <span className="font-semibold text-sm">Condition</span>
          </div>
          <Button variant="ghost" size="sm" onClick={data.onEdit}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          <p className="font-medium">{data.condition_type || "No condition"}</p>
          <p className="truncate">{data.condition_value || ""}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="yes" className="w-3 h-3" style={{ left: "25%" }} />
      <Handle type="source" position={Position.Bottom} id="no" className="w-3 h-3" style={{ left: "75%" }} />
    </Card>
  );
});

ConditionStepNode.displayName = "ConditionStepNode";
