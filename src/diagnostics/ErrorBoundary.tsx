import React from "react";
import { diagnosticsStore } from "./diagnosticsStore";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    return { 
      hasError: true, 
      message: err instanceof Error ? err.message : String(err) 
    };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    diagnosticsStore.add({
      type: "error",
      ts: performance.now(),
      message: error instanceof Error ? error.message : String(error),
      stack: errorInfo.componentStack || undefined,
      source: "react",
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h2>
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
            {this.state.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}
