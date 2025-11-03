import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { type TierType } from '@/config/subscriptions';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireMerchant?: boolean;
  requiredTier?: TierType;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireMerchant = false,
  requiredTier,
  redirectTo = '/auth',
}: ProtectedRouteProps) {
  const location = useLocation();
  const { ready, user, isAdmin: authIsAdmin } = useAuth();
  const { isAdmin, isMerchant, requiresMinimumTier, loading: subLoading } = useSubscription();

  // Show loading state while auth or subscription is initializing
  if (!ready || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${redirectTo}?returnTo=${returnTo}`} replace />;
  }

  // Check admin requirement (use both auth context and subscription context)
  if (requireAdmin && !isAdmin && !authIsAdmin) {
    return <Navigate to="/" replace />;
  }

  // Check merchant requirement
  if (requireMerchant && !isMerchant) {
    return <Navigate to="/" replace />;
  }

  // Check tier requirement
  if (requiredTier && !requiresMinimumTier(requiredTier)) {
    const returnTo = encodeURIComponent(location.pathname);
    return <Navigate to={`/subscribe?returnTo=${returnTo}`} replace />;
  }

  return <>{children}</>;
}
