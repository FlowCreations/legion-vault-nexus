import { diagnosticsStore } from "./diagnosticsStore";

export function startErrorObservers() {
  const handleWindowError = (event: ErrorEvent) => {
    diagnosticsStore.add({
      type: "error",
      ts: performance.now(),
      message: event.message,
      stack: event.error?.stack,
      source: "window",
    });
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const message = event.reason instanceof Error 
      ? event.reason.message 
      : String(event.reason);
    const stack = event.reason instanceof Error ? event.reason.stack : undefined;
    
    diagnosticsStore.add({
      type: "error",
      ts: performance.now(),
      message,
      stack,
      source: "promise",
    });
  };

  window.addEventListener("error", handleWindowError);
  window.addEventListener("unhandledrejection", handleUnhandledRejection);

  return () => {
    window.removeEventListener("error", handleWindowError);
    window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  };
}
