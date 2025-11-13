import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface RoleCheckResult {
  isAdmin: boolean;
  isMerchant: boolean;
  isLoading: boolean;
}

// Cache for role checks to avoid redundant queries
const roleCache = new Map<string, { roles: string[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useRoleCheck(user: User | null): RoleCheckResult {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkRoles = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsMerchant(false);
        setIsLoading(false);
        return;
      }

      // Check cache first
      const cached = roleCache.get(user.id);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setIsAdmin(cached.roles.includes('admin'));
        setIsMerchant(cached.roles.includes('merchant') || cached.roles.includes('admin'));
        setIsLoading(false);
        return;
      }

      try {
        // Single query to fetch all roles at once
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['merchant', 'admin']);

        const roleList = roles?.map(r => r.role) || [];
        
        // Update cache
        roleCache.set(user.id, { roles: roleList, timestamp: now });

        setIsAdmin(roleList.includes('admin'));
        setIsMerchant(roleList.includes('merchant') || roleList.includes('admin'));
      } catch (error) {
        console.error('Error checking roles:', error);
        setIsAdmin(false);
        setIsMerchant(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkRoles();
  }, [user]);

  return { isAdmin, isMerchant, isLoading };
}

// Function to clear cache when needed (e.g., on logout)
export function clearRoleCache() {
  roleCache.clear();
}
