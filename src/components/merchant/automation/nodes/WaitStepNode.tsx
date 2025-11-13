import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Card } from "@/components/ui/card";
import { Clock, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

export const WaitStepNode = memo(({ data }: any) => {
  return (
    <Card className="w-64 shadow-lg border-yellow-500">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="font-semibold text-sm">Wait</span>
          </div>
          <Button variant="ghost" size="sm" onClick={data.onEdit}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          <p>{data.delay_hours || 0} hours</p>
          <p>{data.delay_days || 0} days</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  );
});

WaitStepNode.displayName = "WaitStepNode";
