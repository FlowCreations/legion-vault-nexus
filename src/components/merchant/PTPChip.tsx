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
    return "bg-green-400 border-green-300 animate-pulse";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge className={`${getColor()} font-semibold border-2 w-5 h-5 rounded-full p-0`} />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">
            <strong>PTP (Prime to Purchase):</strong> Real-time purchase readiness; 
            spikes within 48h of emotional events.
            <br /><br />
            Stop → Wait → Go
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
