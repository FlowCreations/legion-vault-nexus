import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('smart_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    // Update status to analyzing
    await supabase
      .from('smart_campaigns')
      .update({ status: 'analyzing' })
      .eq('id', campaignId);

    // Get all users with their engagement data
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('*');

    if (usersError) throw usersError;

    const eventLat = campaign.event_location?.latitude;
    const eventLon = campaign.event_location?.longitude;
    const radiusMiles = campaign.target_radius_miles || 120;

    // Analyze users with AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiPrompt = `Analyze this marketing campaign goal and provide targeting recommendations:

Goal: ${campaign.goal}
Event Location: ${campaign.event_location?.city}, ${campaign.event_location?.state}
Event Date: ${campaign.event_date}
Target Radius: ${radiusMiles} miles (2-hour drive)

Available users: ${users?.length || 0}

Based on this goal, explain:
1. What factors should we prioritize for targeting (location, loyalty, engagement)?
2. How should we score users for conversion probability?
3. What segments make sense (e.g., "local superfans", "traveling fans", etc.)?

Provide a JSON response with this structure:
{
  "targeting_priority": ["distance", "loyalty", "ptp_score", "recent_engagement"],
  "conversion_factors": {"distance_weight": 0.4, "loyalty_weight": 0.3, "ptp_weight": 0.2, "engagement_weight": 0.1},
  "recommended_segments": [
    {"name": "Local Superfans", "criteria": "distance < 50 miles AND loyalty > 0.7"},
    {"name": "Motivated Nearby", "criteria": "distance < 120 miles AND ptp 0.4-0.8"}
  ],
  "reasoning": "explanation of targeting strategy"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a marketing AI that analyzes campaign goals and recommends targeting strategies. Always return valid JSON.' },
          { role: 'user', content: aiPrompt }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiData.choices[0].message.content);
    } catch {
      aiAnalysis = { reasoning: aiData.choices[0].message.content };
    }

    // Calculate targeting for each user
    const targets: any[] = [];
    const locationBreakdown = {
      within_50_miles: 0,
      within_120_miles: 0,
      loyal_fans: 0,
      high_ptp: 0,
      recent_engagement: 0,
      total_selected: 0
    };

    for (const user of users || []) {
      let score = 0;
      const reasons: any = {};
      
      // Calculate distance if location available
      let distanceMiles = null;
      if (eventLat && eventLon && user.latitude && user.longitude) {
        const { data: distanceData } = await supabase.rpc('calculate_distance_miles', {
          lat1: eventLat,
          lon1: eventLon,
          lat2: user.latitude,
          lon2: user.longitude
        });
        distanceMiles = distanceData;
        reasons.distance_miles = Math.round(distanceMiles);
        
        // Distance scoring
        if (distanceMiles <= 50) {
          score += 0.4;
          locationBreakdown.within_50_miles++;
        } else if (distanceMiles <= radiusMiles) {
          score += 0.25;
          locationBreakdown.within_120_miles++;
        }
      }

      // PTP score (yellow to green zone: 0.4 - 1.0)
      const ptpScore = user.ptp_score || 0;
      if (ptpScore >= campaign.ptp_min && ptpScore <= campaign.ptp_max) {
        score += 0.2;
        reasons.ptp_score = ptpScore;
        if (ptpScore > 0.6) locationBreakdown.high_ptp++;
      }

      // Loyalty score
      const loyaltyScore = user.loyalty_score || 0;
      if (loyaltyScore >= campaign.min_loyalty_score) {
        score += 0.3 * loyaltyScore;
        reasons.loyalty_score = loyaltyScore;
        if (loyaltyScore > 0.7) locationBreakdown.loyal_fans++;
      }

      // Recent engagement
      const daysSinceActive = user.last_active_at 
        ? (Date.now() - new Date(user.last_active_at).getTime()) / (1000 * 60 * 60 * 24)
        : 999;
      if (daysSinceActive <= 30) {
        score += 0.1;
        reasons.days_since_active = Math.floor(daysSinceActive);
        locationBreakdown.recent_engagement++;
      }

      // Only include users with minimum score threshold
      if (score >= 0.3) {
        targets.push({
          campaign_id: campaignId,
          user_id: user.user_id,
          targeting_reasons: reasons,
          engagement_score: score,
          predicted_conversion_probability: Math.min(score * 1.2, 1.0)
        });
        locationBreakdown.total_selected++;
      }
    }

    // Insert all targets
    if (targets.length > 0) {
      const { error: targetsError } = await supabase
        .from('campaign_targets')
        .insert(targets);

      if (targetsError) {
        console.error('Error inserting targets:', targetsError);
      }
    }

    // Update campaign with results
    await supabase
      .from('smart_campaigns')
      .update({
        status: 'ready',
        target_count: targets.length,
        ai_analysis: { ...aiAnalysis, location_breakdown: locationBreakdown }
      })
      .eq('id', campaignId);

    // Create performance record
    await supabase
      .from('campaign_performance')
      .insert({
        campaign_id: campaignId,
        total_targeted: targets.length,
        location_breakdown: locationBreakdown
      });

    return new Response(
      JSON.stringify({
        success: true,
        targetCount: targets.length,
        analysis: aiAnalysis,
        breakdown: locationBreakdown
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing campaign targets:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
