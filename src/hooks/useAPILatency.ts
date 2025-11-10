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

// Note: Network interception is now handled by diagnostics/networkProxy.ts
// This keeps the legacy metrics map for compatibility

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
