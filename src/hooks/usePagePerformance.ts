import { useEffect, useRef } from 'react';
import { diagnosticsStore } from '@/diagnostics/diagnosticsStore';

export const usePagePerformance = (pageName: string) => {
  const mountTime = useRef(performance.now());
  const renderCount = useRef(0);

  useEffect(() => {
    const mountDuration = performance.now() - mountTime.current;
    renderCount.current++;

    diagnosticsStore.add({
      type: 'log',
      ts: performance.now(),
      level: 'info',
      message: `Page mounted: ${pageName}`,
      data: { mountDuration: mountDuration.toFixed(2), renderCount: renderCount.current }
    });

    // Log slow mounts (>1000ms)
    if (mountDuration > 1000) {
      console.warn(`[Performance] Slow page mount: ${pageName} took ${mountDuration.toFixed(0)}ms`);
      diagnosticsStore.add({
        type: 'log',
        ts: performance.now(),
        level: 'warn',
        message: `Slow page mount: ${pageName}`,
        data: { mountDuration: mountDuration.toFixed(0) }
      });
    }

    return () => {
      const unmountTime = performance.now() - mountTime.current;
      diagnosticsStore.add({
        type: 'log',
        ts: performance.now(),
        level: 'info',
        message: `Page unmounted: ${pageName}`,
        data: { totalTimeOnPage: unmountTime.toFixed(0) }
      });
    };
  }, [pageName]);

  return {
    mountTime: performance.now() - mountTime.current,
    renderCount: renderCount.current,
  };
};
