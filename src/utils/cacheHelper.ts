// Cache helper for CSV parsing and API data
// Uses sessionStorage for in-session caching to avoid re-parsing

const CACHE_PREFIX = 'analytics_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedData<T> {
  data: T;
  timestamp: number;
}

/**
 * Get cached data if it exists and is not expired
 */
export function getCachedData<T>(key: string): T | null {
  try {
    const cached = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;

    const parsed: CachedData<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - parsed.timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    console.log(`[Cache] Hit for ${key}`);
    return parsed.data;
  } catch (error) {
    console.error('[Cache] Error reading cache:', error);
    return null;
  }
}

/**
 * Set cached data with current timestamp
 */
export function setCachedData<T>(key: string, data: T): void {
  try {
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
    console.log(`[Cache] Set for ${key}`);
  } catch (error) {
    console.error('[Cache] Error setting cache:', error);
    // If quota exceeded, clear old cache
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearCache();
    }
  }
}

/**
 * Clear all analytics cache
 */
export function clearCache(): void {
  try {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
    console.log('[Cache] Cleared all cache');
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
  }
}

/**
 * Wrapper for async data fetching with cache
 */
export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = getCachedData<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();
  setCachedData(key, data);
  return data;
}
