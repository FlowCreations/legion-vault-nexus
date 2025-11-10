import { useState, useEffect, useRef } from "react";
import { diagnosticsStore, DiagnosticEvent } from "@/diagnostics/diagnosticsStore";
import { X, Download, Activity, AlertCircle, Zap, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";

export const HealthOverlay = () => {
  const { isAdmin } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [fps, setFps] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    if (!isAdmin) return; // Skip initialization if not admin
    const debugEnabled = localStorage.getItem("debug:health") === "1";
    setIsVisible(debugEnabled);
  }, [isAdmin]);

  useEffect(() => {
    if (!isVisible || !isAdmin) return;

    const unsubscribe = diagnosticsStore.subscribe((event) => {
      setEvents((prev) => [...prev.slice(-19), event]);
    });

    // FPS monitoring
    let rafId: number;
    const measureFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;
      
      if (elapsed >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      rafId = requestAnimationFrame(measureFps);
    };
    measureFps();

    // Memory monitoring
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        setMemoryUsage(Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100));
      }
    }, 1000);

    return () => {
      unsubscribe();
      cancelAnimationFrame(rafId);
      clearInterval(memoryInterval);
    };
  }, [isVisible, isAdmin]);

  const handleExport = () => {
    const json = diagnosticsStore.export();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggle = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    localStorage.setItem("debug:health", newState ? "1" : "0");
  };

  // Don't render anything if user is not an admin
  if (!isAdmin) {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={handleToggle}
        className="fixed bottom-4 left-4 z-[9999] bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        title="Show diagnostics (Admin only)"
      >
        <Activity className="w-5 h-5" />
      </button>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "error": return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "longtask": return <Zap className="w-4 h-4 text-yellow-500" />;
      case "lag": return <Activity className="w-4 h-4 text-orange-500" />;
      case "network": return <Network className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "error": return "text-destructive";
      case "longtask": return "text-yellow-500";
      case "lag": return "text-orange-500";
      case "network": return "text-blue-500";
      default: return "text-muted-foreground";
    }
  };

  const formatEvent = (event: DiagnosticEvent) => {
    const time = new Date(event.ts).toLocaleTimeString();
    switch (event.type) {
      case "error":
        return `${time} - Error: ${event.message} (${event.source})`;
      case "longtask":
        return `${time} - Long task: ${event.duration.toFixed(1)}ms`;
      case "lag":
        return `${time} - Event loop lag: ${event.delay.toFixed(1)}ms`;
      case "network":
        return `${time} - ${event.method} ${event.url.substring(0, 50)}... ${event.durationMs?.toFixed(0)}ms ${event.status || 'ERR'}`;
      case "log":
        return `${time} - ${event.level.toUpperCase()}: ${event.message}`;
      default:
        return `${time} - Unknown event`;
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999] w-96 bg-card border border-border rounded-lg shadow-xl">
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Health Monitor</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          className="h-6 w-6"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-3 space-y-3">
        {/* Live Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-background rounded p-2 text-center">
            <div className="text-xs text-muted-foreground">FPS</div>
            <div className={`text-lg font-bold ${fps < 30 ? 'text-destructive' : fps < 50 ? 'text-yellow-500' : 'text-green-500'}`}>
              {fps}
            </div>
          </div>
          <div className="bg-background rounded p-2 text-center">
            <div className="text-xs text-muted-foreground">Memory</div>
            <div className={`text-lg font-bold ${memoryUsage > 80 ? 'text-destructive' : memoryUsage > 60 ? 'text-yellow-500' : 'text-green-500'}`}>
              {memoryUsage}%
            </div>
          </div>
          <div className="bg-background rounded p-2 text-center">
            <div className="text-xs text-muted-foreground">Events</div>
            <div className="text-lg font-bold text-primary">
              {diagnosticsStore.getAll().length}
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div>
          <div className="text-xs font-semibold mb-2 text-muted-foreground">Recent Events</div>
          <ScrollArea className="h-48 bg-background rounded border border-border">
            <div className="p-2 space-y-1">
              {events.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-8">
                  No events yet
                </div>
              ) : (
                events.slice().reverse().map((event, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs p-1 rounded hover:bg-muted/50"
                  >
                    {getEventIcon(event.type)}
                    <span className={`flex-1 ${getEventColor(event.type)}`}>
                      {formatEvent(event)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Diagnostics
        </Button>
      </div>
    </div>
  );
}
