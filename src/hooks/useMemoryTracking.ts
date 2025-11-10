import { useEffect, useState } from 'react';
import { diagnosticsStore } from '@/diagnostics/diagnosticsStore';

interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
  timestamp: Date;
}

const memoryHistory: MemoryMetrics[] = [];
const MAX_HISTORY = 100;

export const useMemoryTracking = (intervalMs = 5000) => {
  const [currentMetrics, setCurrentMetrics] = useState<MemoryMetrics | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if performance.memory is available (Chrome/Edge only)
    if (!('memory' in performance)) {
      setIsSupported(false);
      console.warn('[Performance] Memory tracking not supported in this browser');
      return;
    }

    const measureMemory = () => {
      const memory = (performance as any).memory;
      
      const metrics: MemoryMetrics = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
        timestamp: new Date(),
      };

      setCurrentMetrics(metrics);
      
      memoryHistory.push(metrics);
      if (memoryHistory.length > MAX_HISTORY) {
        memoryHistory.shift();
      }

      // Warn if memory usage is high (>80%)
      if (metrics.usagePercentage > 80) {
        console.warn(`[Performance] High memory usage: ${metrics.usagePercentage.toFixed(2)}%`);
        diagnosticsStore.add({
          type: 'log',
          ts: performance.now(),
          level: 'warn',
          message: 'High memory usage',
          data: { usagePercentage: metrics.usagePercentage.toFixed(2) }
        });
      }
    };

    measureMemory();
    const interval = setInterval(measureMemory, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return {
    isSupported,
    currentMetrics,
    getHistory: () => memoryHistory,
    getAverageUsage: () => {
      if (memoryHistory.length === 0) return 0;
      const sum = memoryHistory.reduce((acc, m) => acc + m.usagePercentage, 0);
      return sum / memoryHistory.length;
    },
    getPeakUsage: () => {
      if (memoryHistory.length === 0) return null;
      return memoryHistory.reduce((peak, current) => 
        current.usagePercentage > peak.usagePercentage ? current : peak
      );
    },
  };
};
