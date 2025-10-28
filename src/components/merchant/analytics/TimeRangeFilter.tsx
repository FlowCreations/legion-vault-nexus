import { Button } from "@/components/ui/button";

export type TimeRange = "3M" | "6M" | "1Y" | "ALL";

interface TimeRangeFilterProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}

const ranges: TimeRange[] = ["3M", "6M", "1Y", "ALL"];

const rangeLabels: Record<TimeRange, string> = {
  "3M": "3 Months",
  "6M": "6 Months",
  "1Y": "1 Year",
  "ALL": "All Time"
};

export const TimeRangeFilter = ({ selected, onChange }: TimeRangeFilterProps) => {
  return (
    <div className="flex gap-2 flex-wrap">
      {ranges.map((range) => (
        <Button
          key={range}
          variant={selected === range ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(range)}
          className={`
            rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300
            ${selected === range 
              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20" 
              : "bg-card/50 hover:bg-card border-white/10 text-muted-foreground hover:text-foreground"
            }
          `}
        >
          {rangeLabels[range]}
        </Button>
      ))}
    </div>
  );
};
