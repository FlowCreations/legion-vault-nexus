import { useEffect } from 'react';
import { useRenderTracking } from './useRenderTracking';
import { useAPILatency } from './useAPILatency';
import { useMemoryTracking } from './useMemoryTracking';

interface PerformanceReport {
  renders: any[];
  apis: any[];
  memory: any;
  timestamp: Date;
}

export const usePerformanceTracking = (componentName: string, options = {
  trackRender: true,
  trackAPI: true,
  trackMemory: true,
  memoryInterval: 10000, // 10 seconds
}) => {
  // Only track in development
  const isDev = process.env.NODE_ENV === 'development';
  const renderTracking = isDev && options.trackRender ? useRenderTracking(componentName) : null;
  const apiTracking = isDev && options.trackAPI ? useAPILatency() : null;
  const memoryTracking = isDev && options.trackMemory ? useMemoryTracking(options.memoryInterval) : null;

  const generateReport = (): PerformanceReport => {
    return {
      renders: renderTracking?.getAllMetrics() || [],
      apis: apiTracking?.getMetrics() || [],
      memory: {
        current: memoryTracking?.currentMetrics,
        average: memoryTracking?.getAverageUsage(),
        peak: memoryTracking?.getPeakUsage(),
        history: memoryTracking?.getHistory(),
      },
      timestamp: new Date(),
    };
  };

  const logReport = () => {
    const report = generateReport();
    console.group(`[Performance Report] ${componentName}`);
    
    if (options.trackRender && report.renders.length > 0) {
      console.table(report.renders);
    }
    
    if (options.trackAPI && report.apis.length > 0) {
      console.log('API Metrics:', report.apis);
      const slowest = apiTracking?.getSlowestAPIs(3);
      if (slowest && slowest.length > 0) {
        console.log('Slowest APIs:', slowest);
      }
    }
    
    if (options.trackMemory && memoryTracking?.isSupported) {
      console.log('Memory:', report.memory);
    }
    
    console.groupEnd();
  };

  useEffect(() => {
    // Log performance report on unmount
    return () => {
      if (process.env.NODE_ENV === 'development') {
        logReport();
      }
    };
  }, []);

  return {
    generateReport,
    logReport,
    renderMetrics: renderTracking?.getMetrics(),
    apiMetrics: apiTracking?.getMetrics(),
    memoryMetrics: memoryTracking?.currentMetrics,
  };
};
