import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalEvents: number;
  lastUpdate: Date;
}

export const useMerchantRealtime = () => {
  const [stats, setStats] = useState<RealtimeStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    totalEvents: 0,
    lastUpdate: new Date(),
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtime = async () => {
      // Initial load
      await loadStats();

      // Subscribe to real-time updates
      channel = supabase
        .channel('merchant-dashboard-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_profiles' },
          async (payload) => {
            console.log('[Realtime] User profile change:', payload.eventType);
            await loadStats();
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'events' },
          async (payload) => {
            console.log('[Realtime] New event:', payload.eventType);
            // Increment event count without full reload for better performance
            setStats(prev => ({
              ...prev,
              totalEvents: prev.totalEvents + 1,
              lastUpdate: new Date(),
            }));
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const loadStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { count: activeUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', yesterday.toISOString());

      // Get new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: newUsersToday } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Get total events
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        newUsersToday: newUsersToday || 0,
        totalEvents: totalEvents || 0,
        lastUpdate: new Date(),
      });
    } catch (error) {
      console.error('[Realtime] Error loading stats:', error);
    }
  };

  return { stats, isConnected, refreshStats: loadStats };
};
