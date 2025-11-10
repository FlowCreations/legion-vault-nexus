import { diagnosticsStore } from "./diagnosticsStore";

export function startEventLoopLagMonitor(intervalMs = 100, warnThresholdMs = 200) {
  let last = performance.now();
  
  const id = setInterval(() => {
    const now = performance.now();
    const drift = now - last - intervalMs;
    
    if (drift > warnThresholdMs) {
      diagnosticsStore.add({ 
        type: "lag", 
        ts: now, 
        delay: drift 
      });
    }
    
    last = now;
  }, intervalMs);

  return () => clearInterval(id);
}
