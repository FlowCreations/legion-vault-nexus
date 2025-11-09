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
        // Load after brief delay
        timeoutId = setTimeout(load, delay || 100);
        break;
      
      case 'medium':
        // Load when browser is idle
        if ('requestIdleCallback' in window) {
          idleCallbackId = requestIdleCallback(load, { timeout: delay || 500 });
        } else {
          timeoutId = setTimeout(load, delay || 300);
        }
        break;
      
      case 'low':
        // Load when browser is idle with longer timeout
        if ('requestIdleCallback' in window) {
          idleCallbackId = requestIdleCallback(load, { timeout: delay || 2000 });
        } else {
          timeoutId = setTimeout(load, delay || 1000);
        }
        break;
      
      case 'idle':
        // Load only when browser is truly idle
        if ('requestIdleCallback' in window) {
          idleCallbackId = requestIdleCallback(load, { timeout: delay || 5000 });
        } else {
          timeoutId = setTimeout(load, delay || 2000);
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
