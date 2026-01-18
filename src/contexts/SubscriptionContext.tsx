import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TIERS, type TierType, hasFeatureAccess, hasMinimumTier } from '@/config/subscriptions';

interface SubscriptionContextType {
  isSubscribed: boolean;
  tier: TierType;
  isAdmin: boolean;
  isMerchant: boolean;
  loading: boolean;
  hasAccess: (feature: string) => boolean;
  requiresMinimumTier: (requiredTier: TierType) => boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [tier, setTier] = useState<TierType>(TIERS.FREE);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    try {
      setLoading(true);
      
      // Check auth status
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Not logged in - free tier
        setIsSubscribed(false);
        setTier(TIERS.FREE);
        setIsAdmin(false);
        setIsMerchant(false);
        return;
      }

      // Run ALL checks in parallel for faster loading
      const [rolesResult, subResult] = await Promise.all([
        // Single query for all roles
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['merchant', 'admin']),
        
        // Subscription check with shorter 2s timeout
        Promise.race([
          supabase.functions.invoke('check-subscription'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 2000)
          )
        ]).catch(() => ({ data: null, error: 'timeout' }))
      ]);

      // Process roles
      const roles = rolesResult.data?.map(r => r.role) || [];
      const adminStatus = roles.includes('admin');
      const merchantStatus = roles.includes('merchant') || adminStatus;
      
      setIsAdmin(adminStatus);
      setIsMerchant(merchantStatus);

      // Process subscription
      const subData = (subResult as any)?.data;
      if (subData?.subscribed && subData?.subscription?.plan_name) {
        setIsSubscribed(true);
        const planName = subData.subscription.plan_name.toLowerCase();
        if (planName.includes('legionnaire')) {
          setTier(TIERS.LEGIONNAIRE);
        } else if (planName.includes('outlaw')) {
          setTier(TIERS.OUTLAW);
        } else if (planName.includes('rebel')) {
          setTier(TIERS.REBEL);
        } else {
          setTier(TIERS.FREE);
        }
      } else if (adminStatus) {
        // Admins get full access even without subscription
        setIsSubscribed(true);
        setTier(TIERS.LEGIONNAIRE);
      } else {
        setIsSubscribed(false);
        setTier(TIERS.FREE);
      }
    } catch (error) {
      console.error('Error in checkSubscription:', error);
      setIsSubscribed(false);
      setTier(TIERS.FREE);
      setIsAdmin(false);
      setIsMerchant(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only check subscription once auth is ready
    if (!ready) return;
    
    checkSubscription();
  }, [ready, user?.id]); // Only re-run when user ID changes, not object reference

  const hasAccess = (feature: string): boolean => {
    // Admins have access to everything
    if (isAdmin) return true;
    
    // Check tier-based feature access
    return hasFeatureAccess(tier, feature);
  };

  const requiresMinimumTier = (requiredTier: TierType): boolean => {
    // Admins have access to everything
    if (isAdmin) return true;
    
    // Check if user's tier meets minimum requirement
    return hasMinimumTier(tier, requiredTier);
  };

  const refreshSubscription = async () => {
    await checkSubscription();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        tier,
        isAdmin,
        isMerchant,
        loading,
        hasAccess,
        requiresMinimumTier,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
