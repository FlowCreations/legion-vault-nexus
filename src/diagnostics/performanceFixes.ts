import { diagnosticsStore } from './diagnosticsStore';
import { QueryClient } from '@tanstack/react-query';

// We'll receive the queryClient as a parameter since it's instantiated in App.tsx
let globalQueryClient: QueryClient | null = null;

export const setQueryClient = (client: QueryClient) => {
  globalQueryClient = client;
};

export interface FixResult {
  success: boolean;
  message: string;
  details?: string;
}

/**
 * Clear React Query cache to free memory
 */
export const clearQueryCache = (): FixResult => {
  try {
    if (!globalQueryClient) {
      return {
        success: false,
        message: 'Query client not initialized',
        details: 'Unable to clear cache'
      };
    }
    globalQueryClient.clear();
    return {
      success: true,
      message: 'Cleared React Query cache',
      details: 'All cached API data has been cleared'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to clear query cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Clear old items from localStorage (older than 1 hour)
 */
export const clearOldLocalStorage = (): FixResult => {
  try {
    let clearedCount = 0;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // Don't clear important keys
      if (key.startsWith('debug:') || key === 'theme' || key === 'i18nextLng') continue;
      
      try {
        const value = localStorage.getItem(key);
        if (!value) continue;
        
        const parsed = JSON.parse(value);
        if (parsed.timestamp && (now - parsed.timestamp > oneHour)) {
          keysToRemove.push(key);
          clearedCount++;
        }
      } catch {
        // Skip if not JSON or doesn't have timestamp
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    return {
      success: true,
      message: `Cleared ${clearedCount} old localStorage items`,
      details: clearedCount > 0 ? 'Freed up local storage space' : 'No old items to clear'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to clear localStorage',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Clear old diagnostic events, keeping only recent ones
 */
export const clearOldDiagnosticEvents = (keepCount: number = 50): FixResult => {
  try {
    const beforeCount = diagnosticsStore.getAll().length;
    diagnosticsStore.clearOld(keepCount);
    const afterCount = diagnosticsStore.getAll().length;
    const cleared = beforeCount - afterCount;
    
    return {
      success: true,
      message: `Cleared ${cleared} diagnostic events`,
      details: `Kept ${afterCount} most recent events`
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to clear diagnostic events',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Trigger garbage collection hints (if available)
 */
export const triggerGCHint = (): FixResult => {
  try {
    // Modern browsers will GC automatically, but we can try to hint
    if (window.gc) {
      window.gc();
      return {
        success: true,
        message: 'Triggered garbage collection',
        details: 'Memory cleanup requested'
      };
    }
    return {
      success: true,
      message: 'GC not available',
      details: 'Browser will handle memory automatically'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to trigger GC',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Get a summary of current performance issues
 */
export const getDiagnosticSummary = () => {
  const events = diagnosticsStore.getAll();
  const recentEvents = events.filter(e => performance.now() - e.ts < 60000); // Last minute
  
  return {
    totalEvents: events.length,
    recentEvents: recentEvents.length,
    errors: events.filter(e => e.type === 'error').length,
    longTasks: events.filter(e => e.type === 'longtask').length,
    lagEvents: events.filter(e => e.type === 'lag').length,
    networkErrors: events.filter(e => e.type === 'network' && !e.ok).length,
  };
};

/**
 * Optimize page load by clearing route caches
 */
function optimizePageLoad(): FixResult {
  try {
    const routeCacheKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('route-') || key.startsWith('page-')
    );
    
    routeCacheKeys.forEach(key => sessionStorage.removeItem(key));
    
    return {
      success: true,
      message: `Cleared ${routeCacheKeys.length} route cache entries`,
      details: routeCacheKeys.length > 0 ? 'Route caches cleared' : 'No route caches to clear'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to clear route caches',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Run all performance fixes based on current issues
 */
export const runQuickFix = async (fps: number, memoryPercent: number, pageLoadTime?: number): Promise<FixResult[]> => {
  const results: FixResult[] = [];
  const summary = getDiagnosticSummary();
  
  // Always clear old diagnostic events if we have many
  if (summary.totalEvents > 100) {
    results.push(clearOldDiagnosticEvents(50));
  }
  
  // If memory is high, clear caches
  if (memoryPercent > 60) {
    results.push(clearQueryCache());
    results.push(clearOldLocalStorage());
    results.push(triggerGCHint());
  }
  
  // If FPS is low, try to free memory
  if (fps < 40) {
    results.push(clearQueryCache());
    if (summary.totalEvents > 50) {
      results.push(clearOldDiagnosticEvents(20));
    }
  }
  
  // If page load is slow, optimize
  if (pageLoadTime && pageLoadTime > 2000) {
    results.push(optimizePageLoad());
  }
  
  // Small delay to allow cleanup to process
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return results;
};

declare global {
  interface Window {
    gc?: () => void;
  }
}
