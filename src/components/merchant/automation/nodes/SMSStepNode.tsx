import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Card } from "@/components/ui/card";
import { MessageSquare, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

export const SMSStepNode = memo(({ data }: any) => {
  return (
    <Card className="w-64 shadow-lg border-green-500">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-green-500" />
            <span className="font-semibold text-sm">SMS</span>
          </div>
          <Button variant="ghost" size="sm" onClick={data.onEdit}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          <p className="truncate">{data.body || "No message"}</p>
          <p className="text-xs">{data.body?.length || 0}/160 chars</p>
        </div>
        {data.delay_hours && (
          <p className="text-xs text-muted-foreground">Delay: {data.delay_hours}h</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  );
});

SMSStepNode.displayName = "SMSStepNode";
