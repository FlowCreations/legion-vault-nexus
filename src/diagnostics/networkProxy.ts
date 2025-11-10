import { diagnosticsStore } from "./diagnosticsStore";

let originalFetch: typeof fetch | null = null;

export function startNetworkProxy() {
  if (originalFetch) return () => {}; // Already started
  
  originalFetch = window.fetch;
  
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const startTime = performance.now();
    const url = typeof args[0] === 'string' 
      ? args[0] 
      : (args[0] instanceof Request ? args[0].url : String(args[0]));
    const method = args[1]?.method || (args[0] instanceof Request ? args[0].method : 'GET');
    
    try {
      const response = await originalFetch!(...args);
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      // Try to get response size
      const contentLength = response.headers.get('content-length');
      const bytes = contentLength ? parseInt(contentLength, 10) : undefined;
      
      diagnosticsStore.add({
        type: "network",
        ts: startTime,
        url,
        method,
        status: response.status,
        ok: response.ok,
        durationMs: latency,
        bytes,
      });
      
      // Log slow API calls
      if (latency > 1000) {
        console.warn(`[Diagnostics] Slow API call: ${method} ${url} took ${latency.toFixed(2)}ms`);
      }
      
      return response;
    } catch (error) {
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      diagnosticsStore.add({
        type: "network",
        ts: startTime,
        url,
        method,
        durationMs: latency,
        error: error instanceof Error ? error.message : String(error),
      });
      
      throw error;
    }
  };

  return () => {
    if (originalFetch) {
      window.fetch = originalFetch;
      originalFetch = null;
    }
  };
}
