import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

      // Check admin status
      const { data: adminRoleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      const adminStatus = !!adminRoleData;
      setIsAdmin(adminStatus);

      // Check merchant status (merchant or admin)
      const { data: merchantRoleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['merchant', 'admin']);

      const merchantStatus = merchantRoleData && merchantRoleData.length > 0;
      setIsMerchant(merchantStatus);

      // Check subscription via edge function
      const { data: subData, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setIsSubscribed(false);
        setTier(TIERS.FREE);
        return;
      }

      if (subData?.subscribed && subData?.subscription?.plan_name) {
        setIsSubscribed(true);
        // Map Stripe plan name to tier
        const planName = subData.subscription.plan_name;
        if (planName.includes('Legionnaires')) {
          setTier(TIERS.LEGIONNAIRES);
        } else if (planName.includes('Outlaws')) {
          setTier(TIERS.OUTLAWS);
        } else if (planName.includes('Rebels')) {
          setTier(TIERS.REBELS);
        } else {
          setTier(TIERS.FREE);
        }
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
    checkSubscription();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        checkSubscription();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
