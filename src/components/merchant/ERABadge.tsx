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
    if (era <= 3) return "bg-yellow-500 text-white border-2 border-yellow-400";
    if (era <= 6) return "bg-blue-500 text-white border-2 border-blue-400";
    if (era <= 8) return "bg-yellow-600 text-white border-2 border-yellow-500";
    return "bg-black text-white border-2 border-gray-700";
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