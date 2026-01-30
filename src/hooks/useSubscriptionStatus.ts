import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionStatus {
  subscribed: boolean;
  tier?: string;
  loading: boolean;
}

/**
 * Cached subscription status hook to prevent repeated edge function calls
 * Uses aggressive caching since subscription status rarely changes mid-session
 */
export const useSubscriptionStatus = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async (): Promise<{ subscribed: boolean; tier?: string }> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { subscribed: false };
      }
      
      try {
        const { data: subscriptionData, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.warn('[SubscriptionStatus] Error checking subscription:', error);
          return { subscribed: false };
        }
        
        return {
          subscribed: subscriptionData?.subscribed || false,
          tier: subscriptionData?.tier,
        };
      } catch (err) {
        console.warn('[SubscriptionStatus] Failed to check subscription:', err);
        return { subscribed: false };
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - subscription rarely changes mid-session
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on every mount
  });

  return {
    subscribed: data?.subscribed ?? false,
    tier: data?.tier,
    loading: isLoading,
    refetch,
  };
};
