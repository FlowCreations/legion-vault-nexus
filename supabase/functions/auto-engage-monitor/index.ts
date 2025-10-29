import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BehaviorSignal {
  category: 'merch' | 'tickets' | 'music' | 'community';
  signal: string;
  intensity: 'low' | 'medium' | 'high';
  member_id: string;
  metadata?: Record<string, any>;
}

// Signal mapping based on the Smart Fan Automation document
const SIGNAL_INTENSITY_MAP: Record<string, { category: string; intensity: 'low' | 'medium' | 'high' }> = {
  // MERCH - High Intent
  'product_view_multiple': { category: 'merch', intensity: 'high' },
  'add_to_cart': { category: 'merch', intensity: 'high' },
  'product_compare': { category: 'merch', intensity: 'high' },
  'cart_reopened': { category: 'merch', intensity: 'high' },
  
  // MERCH - Medium Intent
  'product_favorited': { category: 'merch', intensity: 'medium' },
  'similar_items_viewed': { category: 'merch', intensity: 'medium' },
  'promo_video_rewatched': { category: 'merch', intensity: 'medium' },
  
  // MERCH - Low Intent
  'size_guide_checked': { category: 'merch', intensity: 'low' },
  'shipping_info_viewed': { category: 'merch', intensity: 'low' },
  
  // TICKETS - High Intent
  'multiple_tour_stops_viewed': { category: 'tickets', intensity: 'high' },
  'tour_post_shared': { category: 'tickets', intensity: 'high' },
  'ticket_email_opened_fast': { category: 'tickets', intensity: 'high' },
  'tour_merch_purchased': { category: 'tickets', intensity: 'high' },
  
  // TICKETS - Medium Intent
  'event_calendar_added': { category: 'tickets', intensity: 'medium' },
  'vip_options_viewed': { category: 'tickets', intensity: 'medium' },
  'live_performance_replayed': { category: 'tickets', intensity: 'medium' },
  
  // TICKETS - Low Intent
  'tour_tab_clicked': { category: 'tickets', intensity: 'low' },
  'event_email_opened': { category: 'tickets', intensity: 'low' },
  
  // MUSIC - High Intent
  'previous_albums_purchased': { category: 'music', intensity: 'high' },
  'frequent_artist_plays': { category: 'music', intensity: 'high' },
  'full_album_listened': { category: 'music', intensity: 'high' },
  'album_merch_checked': { category: 'music', intensity: 'high' },
  
  // MUSIC - Medium Intent
  'track_shared': { category: 'music', intensity: 'medium' },
  'album_sampled': { category: 'music', intensity: 'medium' },
  'new_release_email_opened': { category: 'music', intensity: 'medium' },
  
  // MUSIC - Low Intent
  'track_replayed': { category: 'music', intensity: 'low' },
  'song_completed': { category: 'music', intensity: 'low' },
  'track_saved': { category: 'music', intensity: 'low' },
  
  // COMMUNITY - High Intent
  'direct_message_sent': { category: 'community', intensity: 'high' },
  'member_content_accessed_without_membership': { category: 'community', intensity: 'high' },
  'benefits_page_multiple_views': { category: 'community', intensity: 'high' },
  'pricing_viewed_after_engagement': { category: 'community', intensity: 'high' },
  
  // COMMUNITY - Medium Intent
  'membership_benefits_clicked': { category: 'community', intensity: 'medium' },
  'join_abandoned': { category: 'community', intensity: 'medium' },
  'ama_replay_watched': { category: 'community', intensity: 'medium' },
  
  // COMMUNITY - Low Intent
  'frequent_login': { category: 'community', intensity: 'low' },
  'post_liked': { category: 'community', intensity: 'low' },
  'community_scrolled': { category: 'community', intensity: 'low' },
};

const PTP_THRESHOLDS = {
  low: 20,
  medium: 50,
  high: 75,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if auto-engage is enabled
    const { data: flagData } = await supabase
      .from("feature_flags")
      .select("enabled")
      .eq("flag_name", "auto_engage_fans")
      .single();

    if (!flagData?.enabled) {
      return new Response(
        JSON.stringify({ message: "Auto-Engage is disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get recent events (last 48 hours) to analyze behavior patterns
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    const { data: recentEvents } = await supabase
      .from("events")
      .select("*")
      .gte("ts", fortyEightHoursAgo);

    if (!recentEvents || recentEvents.length === 0) {
      return new Response(
        JSON.stringify({ message: "No recent events to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group events by member and analyze signals
    const memberSignals = new Map<string, BehaviorSignal[]>();
    
    for (const event of recentEvents) {
      if (!event.member_id) continue;
      
      const eventType = event.meta?.event_type || event.type;
      const signalConfig = SIGNAL_INTENSITY_MAP[eventType];
      
      if (signalConfig) {
        if (!memberSignals.has(event.member_id)) {
          memberSignals.set(event.member_id, []);
        }
        
        memberSignals.get(event.member_id)!.push({
          category: signalConfig.category as any,
          signal: eventType,
          intensity: signalConfig.intensity,
          member_id: event.member_id,
          metadata: event.meta,
        });
      }
    }

    // Analyze each member's signals and trigger campaigns if threshold met
    const triggeredCampaigns = [];
    
    for (const [memberId, signals] of memberSignals.entries()) {
      // Calculate PTP score based on signal clustering
      const ptpScore = calculatePTPScore(signals);
      
      // Only trigger if high-intent threshold met AND multiple signal clusters
      const signalClusters = countSignalClusters(signals);
      
      if (ptpScore >= PTP_THRESHOLDS.high && signalClusters >= 2) {
        // Get member profile and current PTP
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", memberId)
          .single();

        if (!profile) continue;

        // Determine campaign type based on dominant category
        const dominantCategory = getDominantCategory(signals);
        
        // Find appropriate automation sequence
        const { data: automation } = await supabase
          .from("automation_sequences")
          .select("*")
          .eq("trigger_type", `auto_engage_${dominantCategory}`)
          .eq("is_active", true)
          .single();

        if (automation) {
          // Enroll member in automation
          const { data: enrollment, error: enrollError } = await supabase
            .from("automation_enrollments")
            .insert({
              automation_id: automation.id,
              user_id: memberId,
              status: 'active',
              metadata: {
                triggered_by: 'auto_engage',
                ptp_score: ptpScore,
                signal_count: signals.length,
                dominant_category: dominantCategory,
                signal_breakdown: {
                  merch: signals.filter(s => s.category === 'merch').length,
                  tickets: signals.filter(s => s.category === 'tickets').length,
                  music: signals.filter(s => s.category === 'music').length,
                  community: signals.filter(s => s.category === 'community').length,
                },
              }
            })
            .select()
            .single();

          if (!enrollError && enrollment) {
            triggeredCampaigns.push({
              member_id: memberId,
              automation_id: automation.id,
              enrollment_id: enrollment.id,
              ptp_score: ptpScore,
              category: dominantCategory,
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analyzed_members: memberSignals.size,
        triggered_campaigns: triggeredCampaigns.length,
        campaigns: triggeredCampaigns,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in auto-engage monitor:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Calculate PTP score based on signal intensity and recency
function calculatePTPScore(signals: BehaviorSignal[]): number {
  let score = 0;
  const now = Date.now();
  
  for (const signal of signals) {
    let baseScore = 0;
    
    switch (signal.intensity) {
      case 'high':
        baseScore = 30;
        break;
      case 'medium':
        baseScore = 15;
        break;
      case 'low':
        baseScore = 5;
        break;
    }
    
    // Apply decay weighting (recent signals count more)
    // Signals in last 6 hours get 100%, then decay to 50% at 48 hours
    const ageHours = (now - new Date(signal.metadata?.timestamp || now).getTime()) / (1000 * 60 * 60);
    const decayFactor = Math.max(0.5, 1 - (ageHours / 96)); // Decay over 4 days to 50%
    
    score += baseScore * decayFactor;
  }
  
  // Cross-category bonus (superfan detection)
  const categories = new Set(signals.map(s => s.category));
  if (categories.size >= 3) {
    score *= 1.3; // 30% bonus for multi-category engagement
  }
  
  return Math.min(100, Math.round(score));
}

// Count distinct signal clusters to prevent single-action triggers
function countSignalClusters(signals: BehaviorSignal[]): number {
  const clusters = new Set<string>();
  
  for (const signal of signals) {
    clusters.add(`${signal.category}_${signal.intensity}`);
  }
  
  return clusters.size;
}

// Get dominant category for campaign targeting
function getDominantCategory(signals: BehaviorSignal[]): string {
  const counts = {
    merch: 0,
    tickets: 0,
    music: 0,
    community: 0,
  };
  
  for (const signal of signals) {
    counts[signal.category]++;
  }
  
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}
