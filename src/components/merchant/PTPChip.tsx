import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PTPChipProps {
  ptp: number;
  status: string;
  delta?: number;
}

export const PTPChip = ({ ptp, status, delta }: PTPChipProps) => {
  const getColor = () => {
    if (status === 'Stop') return "bg-red-600 border-red-400";
    if (status === 'Wait') return "bg-yellow-400 border-yellow-300";
    return "bg-green-500 border-green-400 animate-pulse";
  };

  const getZone = () => {
    if (ptp >= 67) return "Green (67-100)";
    if (ptp >= 34) return "Yellow (34-66)";
    return "Red (0-33)";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge className={`${getColor()} font-semibold border-2 w-5 h-5 rounded-full p-0`} />
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs space-y-2">
            <div>
              <strong>PTP Score:</strong> {ptp}/100
            </div>
            <div>
              <strong>Zone:</strong> {getZone()}
            </div>
            <div className="text-xs text-muted-foreground">
              Weighted behavior scoring based on 60+ engagement signals
            </div>
            {delta !== undefined && (
              <div className={`text-xs ${delta > 0 ? 'text-green-500' : delta < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {Math.abs(delta)} from last period
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
