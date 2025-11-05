import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface APIMetrics {
  endpoint: string;
  method: string;
  latency: number;
  callCount: number;
  errorCount: number;
  lastCalled: Date;
}

const apiMetrics = new Map<string, APIMetrics>();

// Intercept fetch to track API calls
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const startTime = performance.now();
  const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : String(args[0]));
  const method = args[1]?.method || 'GET';
  
  try {
    const response = await originalFetch(...args);
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    trackAPICall(url, method, latency, !response.ok);
    
    // Log slow API calls (>1000ms)
    if (latency > 1000) {
      console.warn(`[Performance] Slow API call: ${method} ${url} took ${latency.toFixed(2)}ms`);
    }
    
    return response;
  } catch (error) {
    const endTime = performance.now();
    trackAPICall(url, method, endTime - startTime, true);
    throw error;
  }
};

const trackAPICall = (endpoint: string, method: string, latency: number, isError: boolean) => {
  const key = `${method}:${endpoint}`;
  const existing = apiMetrics.get(key) || {
    endpoint,
    method,
    latency: 0,
    callCount: 0,
    errorCount: 0,
    lastCalled: new Date(),
  };

  apiMetrics.set(key, {
    endpoint,
    method,
    latency: (existing.latency * existing.callCount + latency) / (existing.callCount + 1),
    callCount: existing.callCount + 1,
    errorCount: existing.errorCount + (isError ? 1 : 0),
    lastCalled: new Date(),
  });
};

export const useAPILatency = () => {
  return {
    getMetrics: (endpoint?: string) => {
      if (endpoint) {
        return Array.from(apiMetrics.values()).filter(m => m.endpoint.includes(endpoint));
      }
      return Array.from(apiMetrics.values());
    },
    getSlowestAPIs: (limit = 5) => {
      return Array.from(apiMetrics.values())
        .sort((a, b) => b.latency - a.latency)
        .slice(0, limit);
    },
    getErrorAPIs: () => {
      return Array.from(apiMetrics.values()).filter(m => m.errorCount > 0);
    },
  };
};
