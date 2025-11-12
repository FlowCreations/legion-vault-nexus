import { useQuery } from '@tanstack/react-query';

interface CacheOptions {
  staleTime?: number;
  gcTime?: number;
}

/**
 * Hook for cached analytics data fetching
 * Prevents duplicate API calls and speeds up tab switches
 */
export function useAnalyticsCache<T>(
  key: string[],
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
) {
  return useQuery({
    queryKey: key,
    queryFn: fetchFn,
    staleTime: options.staleTime || 5 * 60 * 1000, // 5 minutes default
    gcTime: options.gcTime || 30 * 60 * 1000, // 30 minutes default
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
