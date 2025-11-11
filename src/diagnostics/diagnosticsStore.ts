export type LogLevel = "info" | "warn" | "error";

export type DiagnosticEvent =
  | {
      type: "error";
      ts: number;
      message: string;
      stack?: string;
      source?: "window" | "react" | "promise";
    }
  | {
      type: "longtask";
      ts: number;
      duration: number;
      attribution?: Record<string, unknown>[];
    }
  | {
      type: "lag";
      ts: number;
      delay: number;
    }
  | {
      type: "network";
      ts: number;
      url: string;
      method: string;
      status?: number;
      ok?: boolean;
      durationMs?: number;
      bytes?: number;
      error?: string;
    }
  | {
      type: "log";
      ts: number;
      level: LogLevel;
      message: string;
      data?: unknown;
    }
  | {
      type: "pageload";
      ts: number;
      url: string;
      dnsTime: number;
      tcpTime: number;
      requestTime: number;
      domProcessingTime: number;
      totalLoadTime: number;
      fcp?: number;
    }
  | {
      type: "routechange";
      ts: number;
      from: string;
      to: string;
      duration: number;
      wasBlocking: boolean;
    };

type Listener = (e: DiagnosticEvent) => void;

class DiagnosticsStore {
  private events: DiagnosticEvent[] = [];
  private listeners: Set<Listener> = new Set();
  private max = 500;

  add(e: DiagnosticEvent) {
    this.events.push(e);
    if (this.events.length > this.max) {
      this.events.splice(0, this.events.length - this.max);
    }
    this.listeners.forEach((l) => l(e));
  }

  getAll() {
    return [...this.events];
  }

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  export() {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        events: this.events,
      },
      null,
      2
    );
  }

  clearOld(keepCount: number) {
    if (this.events.length > keepCount) {
      this.events = this.events.slice(-keepCount);
    }
  }

  getIssueSummary() {
    const errors = this.events.filter(e => e.type === 'error').length;
    const longTasks = this.events.filter(e => e.type === 'longtask').length;
    const lagEvents = this.events.filter(e => e.type === 'lag').length;
    const networkErrors = this.events.filter(e => e.type === 'network' && !e.ok).length;
    const slowPageLoads = this.events.filter(e => e.type === 'pageload' && e.totalLoadTime > 2000).length;
    const slowRoutes = this.events.filter(e => e.type === 'routechange' && e.wasBlocking).length;
    return { errors, longTasks, lagEvents, networkErrors, slowPageLoads, slowRoutes, total: this.events.length };
  }
}

export const diagnosticsStore = new DiagnosticsStore();

export function diagLog(level: LogLevel, message: string, data?: unknown) {
  diagnosticsStore.add({ type: "log", ts: performance.now(), level, message, data });
}
