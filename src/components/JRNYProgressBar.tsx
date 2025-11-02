import { Star, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JRNYProgressBarProps {
  totalMinutes: number;
  currentBadge: 'silver_star' | 'gold_star' | 'medallion' | null;
  nextMilestone: number;
  compact?: boolean;
}

export const JRNYProgressBar = ({
  totalMinutes,
  currentBadge,
  nextMilestone,
  compact = false,
}: JRNYProgressBarProps) => {
  const milestones = [
    { value: 210, label: 'Silver Star', icon: Star, color: 'from-gray-400 to-gray-300' },
    { value: 300, label: 'Gold Star', icon: Star, color: 'from-yellow-500 to-yellow-400' },
    { value: 420, label: 'Dunbar Medallion', icon: Award, color: 'from-amber-600 to-yellow-500' },
  ];

  const progressPercent = Math.min((totalMinutes / 420) * 100, 100);
  const minutesRemaining = Math.max(0, nextMilestone - totalMinutes);
  const hoursRemaining = (minutesRemaining / 60).toFixed(1);

  const getBadgeStatus = (milestoneValue: number) => {
    if (totalMinutes >= milestoneValue) return 'achieved';
    if (milestoneValue === nextMilestone) return 'next';
    return 'locked';
  };

  return (
    <div className={cn('w-full', compact ? 'space-y-2' : 'space-y-4')}>
      {!compact && (
        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold">Your Journey Progress</h3>
          {currentBadge ? (
            <p className="text-sm text-muted-foreground">
              {minutesRemaining > 0
                ? `${Math.round(progressPercent)}% complete — ${hoursRemaining}h until your next milestone`
                : "Journey complete — you've earned all milestones!"}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Start your journey — {210 - totalMinutes} minutes until your first star
            </p>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary via-accent to-amber-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        >
          {currentBadge && (
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          )}
        </div>

        {/* Milestone Markers */}
        {milestones.map((milestone) => {
          const position = (milestone.value / 420) * 100;
          const status = getBadgeStatus(milestone.value);
          const Icon = milestone.icon;

          return (
            <div
              key={milestone.value}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
              style={{ left: `${position}%` }}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                  status === 'achieved'
                    ? `bg-gradient-to-br ${milestone.color} border-white shadow-lg`
                    : status === 'next'
                    ? 'bg-primary border-primary-foreground animate-pulse'
                    : 'bg-muted border-muted-foreground'
                )}
              >
                <Icon className={cn('w-3 h-3', status === 'achieved' ? 'text-white' : 'text-muted-foreground')} />
              </div>

              {/* Tooltip */}
              {!compact && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg text-xs border">
                    <div className="font-semibold">{milestone.label}</div>
                    <div className="text-muted-foreground">
                      {milestone.value / 60}h ({milestone.value} minutes)
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
