import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

interface MilestoneData {
  current_badge: string | null;
  total_minutes: number;
}

interface CommunityMember {
  id: string;
  user_id: string | null;
  heartbeat_member_id: string | null;
  display_name: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  tier: string | null;
  membership_tier: string | null;
  created_at: string;
  last_active_at: string | null;
  total_spend: number;
  era_current: number | null;
  ptp_current: number | null;
  era_label: string | null;
  ptp_status: string | null;
  watch_time: number | null;
  listen_time: number | null;
  livestream_engagement_score: number | null;
  login_streak: number | null;
  inactive_days: number | null;
  is_super_fan: boolean | null;
  milestone?: MilestoneData;
}

interface UseCommunityMembersParams {
  page: number;
  search: string;
  tierFilter: string;
  milestoneFilter?: string;
  pageSize?: number;
}

// Fetch milestone data once and cache for 5 minutes
async function fetchMilestones() {
  const { data } = await supabase
    .from('milestone_progress')
    .select('user_id, current_badge, total_minutes');
  
  const map = new Map<string, MilestoneData>();
  data?.forEach(m => {
    map.set(m.user_id, {
      current_badge: m.current_badge,
      total_minutes: m.total_minutes || 0,
    });
  });
  return map;
}

// Fetch members with pagination and filters
async function fetchMembersPage({
  page,
  search,
  tierFilter,
  pageSize = 50
}: Omit<UseCommunityMembersParams, 'milestoneFilter'>) {
  let query = supabase
    .from('user_profiles')
    .select('*', { count: 'exact' });

  // Apply search filter
  if (search) {
    query = query.or(
      `display_name.ilike.%${search}%,location.ilike.%${search}%`
    );
  }

  // Apply tier filter
  if (tierFilter !== "all") {
    query = query.or(
      `membership_tier.ilike.%${tierFilter}%,tier.ilike.%${tierFilter}%`
    );
  }

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    members: data || [],
    totalCount: count || 0
  };
}

export function useCommunityMembers({
  page,
  search,
  tierFilter,
  milestoneFilter = "all",
  pageSize = 50
}: UseCommunityMembersParams) {
  // Milestone data cached separately - only fetch once per 5 minutes
  const milestonesQuery = useQuery({
    queryKey: ['milestones-map'],
    queryFn: fetchMilestones,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Members query with pagination - cache for 2 minutes
  const membersQuery = useQuery({
    queryKey: ['community-members', page, search, tierFilter, pageSize],
    queryFn: () => fetchMembersPage({ page, search, tierFilter, pageSize }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  // Combine members with milestone data
  const enrichedMembers = useMemo(() => {
    if (!membersQuery.data?.members) return [];
    
    const milestones = milestonesQuery.data || new Map();
    
    let members = membersQuery.data.members.map((member: any) => ({
      ...member,
      milestone: member.user_id ? milestones.get(member.user_id) : undefined,
    })) as CommunityMember[];

    // Apply milestone filter client-side
    if (milestoneFilter !== "all" && milestones.size > 0) {
      const userIdsWithBadge = Array.from(milestones.entries())
        .filter(([_, m]) => m.current_badge === milestoneFilter)
        .map(([userId]) => userId);
      members = members.filter(m => m.user_id && userIdsWithBadge.includes(m.user_id));
    }

    return members;
  }, [membersQuery.data, milestonesQuery.data, milestoneFilter]);

  const totalCount = milestoneFilter !== "all" 
    ? enrichedMembers.length 
    : (membersQuery.data?.totalCount || 0);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    members: enrichedMembers,
    totalCount,
    totalPages,
    isLoading: membersQuery.isLoading || milestonesQuery.isLoading,
    isFetching: membersQuery.isFetching,
    error: membersQuery.error || milestonesQuery.error,
    refetch: membersQuery.refetch,
  };
}

export type { CommunityMember, MilestoneData };
