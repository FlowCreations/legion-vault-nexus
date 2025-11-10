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
}

export const diagnosticsStore = new DiagnosticsStore();

export function diagLog(level: LogLevel, message: string, data?: unknown) {
  diagnosticsStore.add({ type: "log", ts: performance.now(), level, message, data });
}
