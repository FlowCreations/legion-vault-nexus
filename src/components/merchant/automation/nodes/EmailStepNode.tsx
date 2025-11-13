import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Card } from "@/components/ui/card";
import { Mail, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

export const EmailStepNode = memo(({ data }: any) => {
  return (
    <Card className="w-64 shadow-lg">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-sm">Email</span>
          </div>
          <Button variant="ghost" size="sm" onClick={data.onEdit}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          <p className="font-medium">{data.subject || "No subject"}</p>
          <p className="truncate">{data.body || "No content"}</p>
        </div>
        {data.delay_hours && (
          <p className="text-xs text-muted-foreground">Delay: {data.delay_hours}h</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  );
});

EmailStepNode.displayName = "EmailStepNode";
