import { ReactNode, memo } from 'react';
import { useProgressiveLoad, LoadPriority } from '@/hooks/useProgressiveLoad';
import { Skeleton } from '@/components/ui/skeleton';

interface ProgressiveLoaderProps {
  children: ReactNode;
  priority: LoadPriority;
  delay?: number;
  fallback?: ReactNode;
  className?: string;
}

/**
 * Wrapper component for progressive loading
 * Shows fallback until component is ready to load based on priority
 */
export const ProgressiveLoader = memo(({ 
  children, 
  priority, 
  delay, 
  fallback,
  className 
}: ProgressiveLoaderProps) => {
  const shouldLoad = useProgressiveLoad({ priority, delay });

  if (!shouldLoad) {
    return fallback || (
      <div className={className}>
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  return <>{children}</>;
});

ProgressiveLoader.displayName = 'ProgressiveLoader';
