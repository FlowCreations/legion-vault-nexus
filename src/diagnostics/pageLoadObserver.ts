import { diagnosticsStore } from './diagnosticsStore';

export function startPageLoadObserver() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return () => {};
  }

  const observers: PerformanceObserver[] = [];

  try {
    // Observe navigation timing
    const navigationObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          
          const dnsTime = navEntry.domainLookupEnd - navEntry.domainLookupStart;
          const tcpTime = navEntry.connectEnd - navEntry.connectStart;
          const requestTime = navEntry.responseEnd - navEntry.requestStart;
          const domProcessingTime = navEntry.domInteractive - navEntry.responseEnd;
          const totalLoadTime = navEntry.loadEventEnd - navEntry.fetchStart;

          diagnosticsStore.add({
            type: 'pageload',
            ts: performance.now(),
            url: window.location.pathname,
            dnsTime,
            tcpTime,
            requestTime,
            domProcessingTime,
            totalLoadTime,
          });

          // Log slow page loads
          if (totalLoadTime > 2000) {
            console.warn(`[Performance] Slow page load detected: ${window.location.pathname} took ${totalLoadTime.toFixed(0)}ms`);
            diagnosticsStore.add({
              type: 'log',
              ts: performance.now(),
              level: 'warn',
              message: `Slow page load: ${window.location.pathname}`,
              data: { totalLoadTime: totalLoadTime.toFixed(0), breakdown: { dnsTime, tcpTime, requestTime, domProcessingTime } }
            });
          }
        }
      }
    });

    navigationObserver.observe({ entryTypes: ['navigation'] });
    observers.push(navigationObserver);

    // Observe paint timing (FCP)
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          const fcp = entry.startTime;
          console.log(`[Performance] First Contentful Paint: ${fcp.toFixed(0)}ms`);
          
          diagnosticsStore.add({
            type: 'log',
            ts: performance.now(),
            level: 'info',
            message: 'First Contentful Paint',
            data: { fcp: fcp.toFixed(0) }
          });
        }
      }
    });

    paintObserver.observe({ entryTypes: ['paint'] });
    observers.push(paintObserver);

  } catch (error) {
    console.warn('[Performance] Failed to initialize page load observer:', error);
  }

  return () => {
    observers.forEach(observer => observer.disconnect());
  };
}
