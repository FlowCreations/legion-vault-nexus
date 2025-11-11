import { diagnosticsStore } from './diagnosticsStore';

let lastRoute = window.location.pathname;
let routeChangeStart = performance.now();

export function startRouteChangeObserver() {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const checkRouteChange = () => {
    const currentRoute = window.location.pathname;
    
    if (currentRoute !== lastRoute) {
      const duration = performance.now() - routeChangeStart;
      const wasBlocking = duration > 500;

      diagnosticsStore.add({
        type: 'routechange',
        ts: performance.now(),
        from: lastRoute,
        to: currentRoute,
        duration,
        wasBlocking,
      });

      if (wasBlocking) {
        console.warn(`[Performance] Slow route transition: ${lastRoute} → ${currentRoute} took ${duration.toFixed(0)}ms`);
        diagnosticsStore.add({
          type: 'log',
          ts: performance.now(),
          level: 'warn',
          message: `Slow route change: ${lastRoute} → ${currentRoute}`,
          data: { duration: duration.toFixed(0) }
        });
      } else {
        console.log(`[Performance] Route change: ${lastRoute} → ${currentRoute} (${duration.toFixed(0)}ms)`);
      }

      lastRoute = currentRoute;
      routeChangeStart = performance.now();
    }
  };

  // Check on every animation frame (lightweight)
  let animationFrameId: number;
  const observe = () => {
    checkRouteChange();
    animationFrameId = requestAnimationFrame(observe);
  };
  
  observe();

  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}
