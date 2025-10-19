import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  // Fetch events for this member
  const { data: events } = await supabaseClient
    .from('events')
    .select('*')
    .eq('member_id', memberId)
    .gte('ts', last30Days.toISOString())
    .order('ts', { ascending: false });

  const { data: profile } = await supabaseClient
    .from('user_profiles')
    .select('*')
    .eq('user_id', memberId)
    .single();

  // Compute ERA components
  const c1 = computeSequenceConsistency(events || []);
  const c2 = computeTimeSpentEngagement(events || [], profile);
  const c3 = computeEmotionalTriggerMapping(events || []);
  const c4 = computeDwellStickiness(events || []);
  const c5 = computeEmotionalPolarity(events || []);
  const c6 = computeLoyaltyRewards(profile);

  const eraScore = Math.round(
    ERA_WEIGHTS.sequence_consistency * c1 +
    ERA_WEIGHTS.time_spent_engagement * c2 +
    ERA_WEIGHTS.emotional_trigger_mapping * c3 +
    ERA_WEIGHTS.dwell_stickiness * c4 +
    ERA_WEIGHTS.emotional_polarity * c5 +
    ERA_WEIGHTS.loyalty_rewards * c6
  );

  const era = Math.max(1, Math.min(10, Math.round(eraScore / 10)));
  const eraLabel = getERALabel(era);

  // Compute PTP
  const recentEvents = events?.filter((e: any) => 
    new Date(e.ts) >= last14Days
  ) || [];
  
  const ptp = computePTP(recentEvents, era, profile);
  const ptpStatus = getPTPStatus(ptp);

  // Store scores
  const today = now.toISOString().split('T')[0];
  await supabaseClient
    .from('era_ptp_scores_daily')
    .upsert({
      member_id: memberId,
      date: today,
      era,
      ptp,
      era_components: { c1, c2, c3, c4, c5, c6 },
      ptp_components: { recent_engagement: recentEvents.length },
      updated_at: now.toISOString()
    }, {
      onConflict: 'member_id,date'
    });

  // Update profile
  await supabaseClient
    .from('user_profiles')
    .update({
      era_current: era,
      ptp_current: ptp,
      era_label: eraLabel,
      ptp_status: ptpStatus
    })
    .eq('user_id', memberId);

  return { era, ptp, eraLabel, ptpStatus };
}

function computeSequenceConsistency(events: any[]): number {
  const completionEvents = events.filter(e => 
    e.type === 'watch_complete' || e.type === 'listen_complete'
  );
  return Math.min(100, (completionEvents.length / Math.max(1, events.length)) * 150);
}

function computeTimeSpentEngagement(events: any[], profile: any): number {
  const totalMinutes = (profile?.watch_time || 0) + (profile?.listen_time || 0);
  const engagementEvents = events.filter(e => 
    ['reaction', 'comment'].includes(e.type)
  ).length;
  return Math.min(100, (totalMinutes / 60) + (engagementEvents * 5));
}

function computeEmotionalTriggerMapping(events: any[]): number {
  let score = 0;
  for (let i = 0; i < events.length - 1; i++) {
    if ((events[i].type === 'watch_complete' || events[i].type === 'listen_complete') &&
        (events[i + 1].type === 'add_to_cart' || events[i + 1].type === 'purchase')) {
      const timeDiff = new Date(events[i].ts).getTime() - new Date(events[i + 1].ts).getTime();
      const hoursDiff = Math.abs(timeDiff) / (1000 * 60 * 60);
      if (hoursDiff <= 48) score += 20;
    }
  }
  return Math.min(100, score);
}

function computeDwellStickiness(events: any[]): number {
  const avgLatency = events
    .filter(e => e.click_latency_ms)
    .reduce((sum, e) => sum + (e.click_latency_ms || 0), 0) / Math.max(1, events.length);
  
  const sessionLengths = events.map(e => e.duration_sec || 0);
  const avgSession = sessionLengths.reduce((a, b) => a + b, 0) / Math.max(1, sessionLengths.length);
  
  return Math.min(100, (avgSession / 60) * 2 + (1000 / Math.max(100, avgLatency)) * 10);
}

function computeEmotionalPolarity(events: any[]): number {
  const sentimentEvents = events.filter(e => e.sentiment !== null && e.sentiment !== undefined);
  if (sentimentEvents.length === 0) return 50;
  
  const avgSentiment = sentimentEvents.reduce((sum, e) => sum + (e.sentiment || 0), 0) / sentimentEvents.length;
  return Math.min(100, ((avgSentiment + 1) / 2) * 100);
}

function computeLoyaltyRewards(profile: any): number {
  const totalSpend = profile?.total_spend || 0;
  const mrr = profile?.mrr || 0;
  return Math.min(100, (totalSpend / 100) + (mrr * 10));
}

function computePTP(recentEvents: any[], era: number, profile: any): number {
  let score = 0;
  const now = new Date();
  const halfLife = 72 * 60 * 60 * 1000; // 72 hours in ms

  for (const event of recentEvents) {
    const age = now.getTime() - new Date(event.ts).getTime();
    const decay = Math.exp(-age / halfLife);
    
    let eventWeight = 0;
    if (event.type === 'watch_complete' || event.type === 'listen_complete') {
      eventWeight = (event.sentiment || 0.5) * 15;
    } else if (event.type === 'add_to_cart') {
      eventWeight = 25;
    } else if (event.type === 'page_view' && event.content_id?.includes('product')) {
      eventWeight = 10;
    }

    // 48-hour window boost
    if (age <= 48 * 60 * 60 * 1000) {
      eventWeight *= 1.25;
    }

    score += eventWeight * decay;
  }

  // ERA momentum boost
  score += (era - 5) * 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getERALabel(era: number): string {
  if (era <= 3) return 'Dormant';
  if (era <= 6) return 'Engaged';
  if (era <= 8) return 'Tribe';
  return 'Integrated';
}

function getPTPStatus(ptp: number): string {
  if (ptp < 40) return 'Cold';
  if (ptp < 70) return 'Warm';
  return 'Hot';
}
