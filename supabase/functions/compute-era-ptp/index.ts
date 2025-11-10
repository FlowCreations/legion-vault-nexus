import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { computePTP } from './computePTP.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ERA Component Weights
const ERA_WEIGHTS = {
  sequence_consistency: 0.15,
  time_spent_engagement: 0.25,
  emotional_trigger_mapping: 0.20,
  dwell_stickiness: 0.15,
  emotional_polarity: 0.15,
  loyalty_rewards: 0.10
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { member_id, recompute_all } = await req.json();

    if (recompute_all) {
      // Compute for all members
      const { data: profiles } = await supabaseClient
        .from('user_profiles')
        .select('user_id');

      for (const profile of profiles || []) {
        await computeScores(supabaseClient, profile.user_id);
      }

      return new Response(
        JSON.stringify({ success: true, computed: profiles?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (member_id) {
      // Compute for single member
      const result = await computeScores(supabaseClient, member_id);
      return new Response(
        JSON.stringify({ success: true, ...result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'member_id or recompute_all required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function computeScores(supabaseClient: any, memberId: string) {
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Fetch events for this member (from user_events table, not events)
  const { data: events } = await supabaseClient
    .from('user_events')
    .select('*')
    .eq('user_id', memberId)
    .gte('created_at', last30Days.toISOString())
    .order('created_at', { ascending: false });

  const { data: profile } = await supabaseClient
    .from('user_profiles')
    .select('*')
    .eq('user_id', memberId)
    .single();

  // Compute ERA components
  const sequenceConsistency = computeSequenceConsistency(events || []);
  const timeSpentEngagement = computeTimeSpentEngagement(events || [], profile);
  const emotionalTriggerMapping = computeEmotionalTriggerMapping(events || []);
  const dwellStickiness = computeDwellStickiness(events || []);
  const emotionalPolarity = computeEmotionalPolarity(events || []);
  const loyaltyRewards = computeLoyaltyRewards(profile);

  const eraScore = Math.round(
    ERA_WEIGHTS.sequence_consistency * sequenceConsistency +
    ERA_WEIGHTS.time_spent_engagement * timeSpentEngagement +
    ERA_WEIGHTS.emotional_trigger_mapping * emotionalTriggerMapping +
    ERA_WEIGHTS.dwell_stickiness * dwellStickiness +
    ERA_WEIGHTS.emotional_polarity * emotionalPolarity +
    ERA_WEIGHTS.loyalty_rewards * loyaltyRewards
  );

  const era = Math.max(1, Math.min(10, Math.round(eraScore / 10)));
  const eraLabel = getERALabel(era);

  // Compute PTP using new weighted model
  const ptpResult = await computePTP(supabaseClient, memberId, events || [], profile);
  const ptp = ptpResult.score;
  const ptpStatus = ptpResult.status;
  const ptpZone = ptpResult.zone;
  
  // Store daily scores
  const { error: dailyError } = await supabaseClient
    .from('era_ptp_scores_daily')
    .upsert({
      member_id: memberId,
      date: new Date().toISOString().split('T')[0],
      era: Math.round(era),
      ptp: Math.round(ptp),
      era_components: {
        sequenceConsistency,
        timeSpentEngagement,
        emotionalTriggerMapping,
        dwellStickiness,
        emotionalPolarity,
        loyaltyRewards
      },
      ptp_components: {
        zone: ptpZone,
        totalBehaviors: ptpResult.behaviors.length,
        behaviorBreakdown: ptpResult.behaviors
      }
    }, {
      onConflict: 'member_id,date'
    });
  
  if (dailyError) throw dailyError;
  
  // Log individual behaviors
  for (const behavior of ptpResult.behaviors) {
    await supabaseClient
      .from('ptp_behavior_log')
      .insert({
        user_id: memberId,
        behavior_key: behavior.behavior_key,
        points_awarded: behavior.weight,
        metadata: {
          count: behavior.count || 1,
          tier: behavior.tier
        }
      });
  }
  
  // Update user profile with current scores
  const { error: profileError } = await supabaseClient
    .from('user_profiles')
    .update({
      era: Math.round(era),
      ptp: Math.round(ptp),
      era_label: eraLabel,
      ptp_status: ptpStatus
    })
    .eq('user_id', memberId);
  
  if (profileError) throw profileError;
  
  console.log(`Computed scores for ${memberId}: ERA=${era}, PTP=${ptp} (${ptpZone})`);
  
  return { era: Math.round(era), ptp: Math.round(ptp) };
}

function computeSequenceConsistency(events: any[]): number {
  const completionEvents = events.filter(e => 
    e.event_type === 'video_watch' || e.event_type === 'music_listen'
  );
  return Math.min(100, (completionEvents.length / Math.max(1, events.length)) * 150);
}

function computeTimeSpentEngagement(events: any[], profile: any): number {
  const totalMinutes = ((profile?.watch_time || 0) + (profile?.listen_time || 0)) / 60;
  const engagementEvents = events.filter(e => 
    ['reaction', 'comment_post', 'like'].includes(e.event_type)
  ).length;
  return Math.min(100, (totalMinutes / 60) + (engagementEvents * 5));
}

function computeEmotionalTriggerMapping(events: any[]): number {
  let score = 0;
  for (let i = 0; i < events.length - 1; i++) {
    if ((events[i].event_type === 'video_watch' || events[i].event_type === 'music_listen') &&
        (events[i + 1].event_type === 'add_to_cart' || events[i + 1].event_type === 'purchase_completed')) {
      const timeDiff = new Date(events[i].created_at).getTime() - new Date(events[i + 1].created_at).getTime();
      const hoursDiff = Math.abs(timeDiff) / (1000 * 60 * 60);
      if (hoursDiff <= 48) score += 20;
    }
  }
  return Math.min(100, score);
}

function computeDwellStickiness(events: any[]): number {
  const sessionEvents = events.filter(e => e.event_type === 'session_end' && e.event_data?.duration);
  if (sessionEvents.length === 0) return 50;
  
  const avgSession = sessionEvents.reduce((sum, e) => sum + (e.event_data?.duration || 0), 0) / sessionEvents.length;
  return Math.min(100, (avgSession / 60) * 2);
}

function computeEmotionalPolarity(events: any[]): number {
  const sentimentEvents = events.filter(e => e.event_data?.sentiment !== null && e.event_data?.sentiment !== undefined);
  if (sentimentEvents.length === 0) return 50;
  
  const avgSentiment = sentimentEvents.reduce((sum, e) => sum + (e.event_data?.sentiment || 0), 0) / sentimentEvents.length;
  return Math.min(100, ((avgSentiment + 1) / 2) * 100);
}

function computeLoyaltyRewards(profile: any): number {
  const totalSpend = profile?.total_spend || 0;
  const mrr = profile?.mrr || 0;
  return Math.min(100, (totalSpend / 100) + (mrr * 10));
}

function getERALabel(era: number): string {
  if (era <= 3) return 'Discover';
  if (era <= 6) return 'Engage';
  if (era <= 8) return 'Invest';
  return 'Loyal';
}
