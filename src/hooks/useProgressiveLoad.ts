import { useState, useEffect } from 'react';

export type LoadPriority = 'immediate' | 'high' | 'medium' | 'low' | 'idle';

interface ProgressiveLoadOptions {
  priority: LoadPriority;
  delay?: number;
}

/**
 * Hook to progressively load components based on priority
 * Uses requestIdleCallback for optimal performance
 */
export function useProgressiveLoad({ priority, delay = 0 }: ProgressiveLoadOptions): boolean {
  const [shouldLoad, setShouldLoad] = useState(priority === 'immediate');

  useEffect(() => {
    if (priority === 'immediate') {
      return; // Already loaded
    }

    let timeoutId: NodeJS.Timeout;
    let idleCallbackId: number;

    const load = () => setShouldLoad(true);

    switch (priority) {
      case 'high':
        timeoutId = setTimeout(load, delay || 0);
        break;
      
      case 'medium':
        timeoutId = setTimeout(load, delay || 10);
        break;
      
      case 'low':
        if ('requestIdleCallback' in window) {
          idleCallbackId = requestIdleCallback(load, { timeout: delay || 50 });
        } else {
          timeoutId = setTimeout(load, delay || 50);
        }
        break;
      
      case 'idle':
        // Load with a max timeout to prevent pages appearing stuck
        // Use shorter timeout (500ms max) to ensure content loads reliably
        const maxDelay = Math.min(delay || 200, 500);
        if ('requestIdleCallback' in window) {
          idleCallbackId = requestIdleCallback(load, { timeout: maxDelay });
        } else {
          timeoutId = setTimeout(load, maxDelay);
        }
        break;
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (idleCallbackId && 'cancelIdleCallback' in window) {
        cancelIdleCallback(idleCallbackId);
      }
    };
  }, [priority, delay]);

  return shouldLoad;
}
