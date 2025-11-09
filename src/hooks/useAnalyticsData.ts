import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  parseViberateProfile, 
  parseAudienceMap, 
  parseEngagementTimeline,
  parseWeeklyMetrics,
  parsePlatformDistribution,
  parseTopTracks,
  parseAudienceDemographics,
} from '@/utils/analyticsDataParser';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const CACHE_TIME = 30 * 60 * 1000; // 30 minutes

// Viberate Profile
export const useViberateProfile = () => {
  return useQuery({
    queryKey: ['viberate-profile'],
    queryFn: parseViberateProfile,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
};

// Audience Map
export const useAudienceMap = () => {
  return useQuery({
    queryKey: ['audience-map'],
    queryFn: parseAudienceMap,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
};

// Engagement Timeline
export const useEngagementTimeline = () => {
  return useQuery({
    queryKey: ['engagement-timeline'],
    queryFn: parseEngagementTimeline,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
};

// Weekly Metrics
export const useWeeklyMetrics = () => {
  return useQuery({
    queryKey: ['weekly-metrics'],
    queryFn: parseWeeklyMetrics,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
};

// Platform Distribution
export const usePlatformDistribution = () => {
  return useQuery({
    queryKey: ['platform-distribution'],
    queryFn: parsePlatformDistribution,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
};

// Top Tracks with period parameter
export const useTopTracks = (period: '7days' | '28days' | 'alltime') => {
  return useQuery({
    queryKey: ['top-tracks', period],
    queryFn: () => parseTopTracks(period),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
};

// Demographics
export const useDemographics = () => {
  return useQuery({
    queryKey: ['demographics'],
    queryFn: parseAudienceDemographics,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
};

// Prefetch hook for preloading data
export const usePrefetchAnalytics = () => {
  const queryClient = useQueryClient();
  
  const prefetchAll = () => {
    queryClient.prefetchQuery({
      queryKey: ['viberate-profile'],
      queryFn: parseViberateProfile,
    });
    queryClient.prefetchQuery({
      queryKey: ['platform-distribution'],
      queryFn: parsePlatformDistribution,
    });
    queryClient.prefetchQuery({
      queryKey: ['engagement-timeline'],
      queryFn: parseEngagementTimeline,
    });
  };

  return { prefetchAll };
};
