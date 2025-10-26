import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Edit, Trash2, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface EmailListCardProps {
  list: {
    id: string;
    name: string;
    description?: string;
    member_count: number;
    created_at: string;
    filter_rules: any;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export const EmailListCard = ({ list, onEdit, onDelete }: EmailListCardProps) => {
  const isSmartList = list.filter_rules?.smart === true;

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{list.name}</h3>
            {isSmartList && (
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Smart
              </Badge>
            )}
          </div>
          {list.description && (
            <p className="text-sm text-muted-foreground">{list.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="text-sm">
            {list.member_count.toLocaleString()} members
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Created {format(new Date(list.created_at), 'MMM d, yyyy')}
        </p>
      </div>

      {list.filter_rules?.conditions && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">Filter Rules:</p>
          <div className="flex flex-wrap gap-1">
            {list.filter_rules.conditions.slice(0, 3).map((condition: any, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {condition.field} {condition.operator} {condition.value}
              </Badge>
            ))}
            {list.filter_rules.conditions.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{list.filter_rules.conditions.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
