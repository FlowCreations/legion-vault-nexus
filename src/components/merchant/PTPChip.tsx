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
    if (status === 'Cold') return "bg-red-500/20 text-red-400 border-red-500/50";
    if (status === 'Warm') return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    return "bg-green-500/20 text-green-400 border-green-500/50 animate-pulse";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge className={`${getColor()} font-semibold px-3 py-1 border w-3 h-3 rounded-full p-0`} />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">
            <strong>PTP (Prime to Purchase):</strong> Real-time purchase readiness; 
            spikes within 48h of emotional events.
            <br /><br />
            Cold → Warm → Hot
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
