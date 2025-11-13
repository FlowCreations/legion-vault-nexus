import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface SubscriptionStatus {
  subscribed: boolean;
  is_admin: boolean;
  subscription: any;
  isLoading: boolean;
}

// Cache for subscription checks
const subscriptionCache = new Map<string, { status: any, timestamp: number }>();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

export function useSubscriptionCheck(user: User | null): SubscriptionStatus {
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    is_admin: false,
    subscription: null,
    isLoading: true
  });

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setStatus({
          subscribed: false,
          is_admin: false,
          subscription: null,
          isLoading: false
        });
        return;
      }

      // Check cache first
      const cached = subscriptionCache.get(user.id);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setStatus({ ...cached.status, isLoading: false });
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');

        if (error) throw error;

        const newStatus = {
          subscribed: data?.subscribed || false,
          is_admin: data?.is_admin || false,
          subscription: data?.subscription || null,
          isLoading: false
        };

        // Update cache
        subscriptionCache.set(user.id, { 
          status: newStatus, 
          timestamp: now 
        });

        setStatus(newStatus);
      } catch (error) {
        console.error('Error checking subscription:', error);
        setStatus({
          subscribed: false,
          is_admin: false,
          subscription: null,
          isLoading: false
        });
      }
    };

    checkSubscription();
  }, [user]);

  return status;
}

// Function to clear cache when needed
export function clearSubscriptionCache() {
  subscriptionCache.clear();
}
