import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ERABadgeProps {
  era: number;
  label: string;
}

export const ERABadge = ({ era, label }: ERABadgeProps) => {
  const getLabel = () => {
    if (era <= 3) return "Discover";
    if (era <= 6) return "Engage";
    if (era <= 8) return "Invest";
    return "Loyal";
  };

  const getColor = () => {
    if (era <= 3) return "bg-gray-500 text-white";
    if (era <= 6) return "bg-steel-500 text-white";
    if (era <= 8) return "bg-yellow-600 text-white border border-yellow-400";
    return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border border-yellow-400";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge className={`${getColor()} font-semibold px-3 py-1`}>
            ERA • {getLabel()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">
            <strong>ERA:</strong> Composite of sequence consistency, engagement depth, 
            emotional polarity, stickiness, and loyalty.
            <br /><br />
            Discover → Engage → Invest → Loyal
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
