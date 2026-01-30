import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface AuthStatus {
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
  loading: boolean;
}

/**
 * Cached auth status hook to prevent repeated auth checks
 * Automatically updates when auth state changes
 */
export const useAuthStatus = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auth-status'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      return {
        isAuthenticated: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Listen for auth state changes and refetch
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED'].includes(event)) {
        refetch();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refetch]);

  return {
    isAuthenticated: data?.isAuthenticated ?? false,
    userId: data?.userId,
    email: data?.email,
    loading: isLoading,
    refetch,
  };
};
