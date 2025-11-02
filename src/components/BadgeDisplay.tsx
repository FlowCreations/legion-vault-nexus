import { Star, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BadgeDisplayProps {
  badge: 'silver_star' | 'gold_star' | 'medallion' | null;
  size?: 'sm' | 'md' | 'lg';
}

export const BadgeDisplay = ({ badge, size = 'sm' }: BadgeDisplayProps) => {
  if (!badge) return null;

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const badgeConfig = {
    silver_star: {
      icon: Star,
      gradient: 'from-gray-400 to-gray-300',
      glow: 'drop-shadow-[0_0_8px_rgba(192,192,192,0.6)]',
    },
    gold_star: {
      icon: Star,
      gradient: 'from-yellow-500 to-yellow-400',
      glow: 'drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]',
    },
    medallion: {
      icon: Award,
      gradient: 'from-amber-600 to-yellow-500',
      glow: 'drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]',
    },
  };

  const config = badgeConfig[badge];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br flex items-center justify-center',
        config.gradient,
        config.glow,
        sizeClasses[size],
        'animate-shimmer'
      )}
      title={`${badge.replace('_', ' ')} badge`}
    >
      <Icon className={cn('text-white', iconSizes[size])} />
    </div>
  );
};
