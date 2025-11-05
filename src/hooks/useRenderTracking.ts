import { useEffect, useRef } from 'react';

interface RenderMetrics {
  componentName: string;
  renderTime: number;
  renderCount: number;
}

const performanceMetrics = new Map<string, RenderMetrics>();

export const useRenderTracking = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    renderCount.current++;

    const metrics = performanceMetrics.get(componentName) || {
      componentName,
      renderTime: 0,
      renderCount: 0,
    };

    performanceMetrics.set(componentName, {
      componentName,
      renderTime: (metrics.renderTime + renderTime) / 2, // Moving average
      renderCount: renderCount.current,
    });

    // Log slow renders (>16ms = below 60fps)
    if (renderTime > 16) {
      console.warn(`[Performance] Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }

    startTime.current = performance.now();
  });

  return {
    getMetrics: () => performanceMetrics.get(componentName),
    getAllMetrics: () => Array.from(performanceMetrics.values()),
  };
};
