import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MilestoneProgress {
  totalMinutes: number;
  currentBadge: 'silver_star' | 'gold_star' | 'medallion' | null;
  nextMilestone: number;
  progressPercent: number;
}

export interface MilestoneAchievement {
  id: string;
  milestone_type: 'silver_star' | 'gold_star' | 'dunbar_champion';
  achieved_at: string;
  total_minutes_at_achievement: number;
}

export const useMilestoneProgress = () => {
  const [progress, setProgress] = useState<MilestoneProgress>({
    totalMinutes: 0,
    currentBadge: null,
    nextMilestone: 210,
    progressPercent: 0,
  });
  const [newMilestone, setNewMilestone] = useState<MilestoneAchievement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('milestone_progress')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching milestone progress:', error);
          setLoading(false);
          return;
        }

        if (data) {
          const nextMilestone = data.next_milestone_minutes || 420;
          setProgress({
            totalMinutes: data.total_minutes,
            currentBadge: data.current_badge as 'silver_star' | 'gold_star' | 'medallion' | null,
            nextMilestone,
            progressPercent: Math.min((data.total_minutes / 420) * 100, 100),
          });
        }
      } catch (error) {
        console.error('Error in fetchProgress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();

    // Subscribe to milestone achievements
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('milestone_achievements')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_milestones',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNewMilestone(payload.new as MilestoneAchievement);
            // Refetch progress after achievement
            fetchProgress();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupSubscription();

    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, []);

  return {
    progress,
    newMilestone,
    loading,
    clearMilestone: () => setNewMilestone(null),
  };
};
