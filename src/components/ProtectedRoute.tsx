import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { type TierType } from '@/config/subscriptions';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requiredTier?: TierType;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = false,
  requireAdmin = false,
  requiredTier,
  redirectTo = '/auth',
}: ProtectedRouteProps) {
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isAdmin, requiresMinimumTier, loading: subLoading } = useSubscription();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  // Show loading state
  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Check tier requirement
  if (requiredTier && !requiresMinimumTier(requiredTier)) {
    return <Navigate to="/subscribe" replace />;
  }

  return <>{children}</>;
}
