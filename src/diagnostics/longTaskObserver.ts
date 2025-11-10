import { diagnosticsStore } from "./diagnosticsStore";

export function startLongTaskObserver() {
  if (!("PerformanceObserver" in window)) return () => {};
  
  const supportedEntryTypes = (PerformanceObserver as any).supportedEntryTypes;
  if (!supportedEntryTypes?.includes("longtask")) return () => {};

  const po = new PerformanceObserver((list: PerformanceObserverEntryList) => {
    for (const entry of list.getEntries()) {
      const anyEntry = entry as any;
      diagnosticsStore.add({
        type: "longtask",
        ts: entry.startTime,
        duration: entry.duration,
        attribution: anyEntry.attribution || [],
      });
    }
  });

  try {
    po.observe({ type: "longtask", buffered: true } as any);
  } catch (e) {
    console.warn("[Diagnostics] Long task observer failed to start:", e);
    return () => {};
  }

  return () => po.disconnect();
}
