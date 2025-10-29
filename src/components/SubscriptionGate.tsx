import { ReactNode } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { TIERS, type TierType } from '@/config/subscriptions';
import { UpgradePrompt } from './UpgradePrompt';

interface SubscriptionGateProps {
  children: ReactNode;
  feature?: string;
  requiredTier?: TierType;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function SubscriptionGate({
  children,
  feature,
  requiredTier,
  fallback,
  showUpgradePrompt = true,
}: SubscriptionGateProps) {
  const { hasAccess, requiresMinimumTier, tier, loading } = useSubscription();

  // While loading, show nothing
  if (loading) {
    return null;
  }

  // Check access by feature name
  if (feature) {
    const hasFeatureAccess = hasAccess(feature);
    if (!hasFeatureAccess) {
      if (fallback) return <>{fallback}</>;
      if (showUpgradePrompt) {
        return <UpgradePrompt feature={feature} currentTier={tier} />;
      }
      return null;
    }
  }

  // Check access by tier level
  if (requiredTier) {
    const hasTierAccess = requiresMinimumTier(requiredTier);
    if (!hasTierAccess) {
      if (fallback) return <>{fallback}</>;
      if (showUpgradePrompt) {
        return <UpgradePrompt requiredTier={requiredTier} currentTier={tier} />;
      }
      return null;
    }
  }

  return <>{children}</>;
}
