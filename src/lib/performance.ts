/**
 * Performance optimization utilities for reducing redundant queries and improving load times
 */

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Deduplicates identical requests that happen in quick succession
 * If the same query is called multiple times, only one request is made
 */
export async function dedupeRequest<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl = 1000
): Promise<T> {
  // Check if request is already pending
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  // Create new request
  const promise = fetchFn().finally(() => {
    // Clean up after TTL
    setTimeout(() => {
      pendingRequests.delete(key);
    }, ttl);
  });

  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Clear all pending request dedupe cache
 */
export function clearDedupeCache() {
  pendingRequests.clear();
}

/**
 * Batches multiple setState calls into a single re-render
 */
export function batchStateUpdates(updates: Array<() => void>) {
  Promise.resolve().then(() => {
    updates.forEach(update => update());
  });
}

/**
 * Delays non-critical operations until after page load
 */
export function deferNonCritical(callback: () => void, delay = 1000) {
  if (document.readyState === 'complete') {
    setTimeout(callback, delay);
  } else {
    window.addEventListener('load', () => {
      setTimeout(callback, delay);
    }, { once: true });
  }
}
