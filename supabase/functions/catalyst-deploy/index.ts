import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchMatrixInput {
  userId: string;
  ptpScore: number;
  eraScore: number;
  emotionalState?: string;
  recentBehaviors: string[];
  inactiveDays: number;
  totalSpend: number;
}

interface CampaignMatch {
  campaign: any;
  matchScore: number;
  personalizedMessage: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    console.log('[CATALYST] Starting deployment...');

    // =============================================
    // STEP 1: GATHER ALL INTELLIGENCE DATA
    // =============================================
    
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get all user profiles with PTP/ERA scores
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, ptp_current, era_current, ptp_status, era_label, total_spend, inactive_days, last_login')
      .not('ptp_current', 'is', null);

    if (profilesError) throw profilesError;

    // Get recent PTP behavior logs (last 30 days)
    const { data: behaviorLogs, error: behaviorError } = await supabase
      .from('ptp_behavior_log')
      .select('user_id, behavior_key, points_awarded, created_at')
      .gte('created_at', last30Days.toISOString());

    // Get active campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('catalyst_campaigns')
      .select('*')
      .eq('status', 'active')
      .order('priority', { ascending: false });

    if (campaignsError) throw campaignsError;

    console.log(`[CATALYST] Analyzing ${profiles?.length || 0} profiles against ${campaigns?.length || 0} campaigns`);

    // =============================================
    // STEP 2: BUILD MATCH MATRIX
    // =============================================
    
    const matchMatrix: Map<string, MatchMatrixInput> = new Map();
    
    for (const profile of profiles || []) {
      const userBehaviors = behaviorLogs?.filter(b => b.user_id === profile.user_id).map(b => b.behavior_key) || [];
      
      matchMatrix.set(profile.user_id, {
        userId: profile.user_id,
        ptpScore: profile.ptp_current || 0,
        eraScore: profile.era_current || 0,
        emotionalState: profile.era_label || 'unknown',
        recentBehaviors: userBehaviors,
        inactiveDays: profile.inactive_days || 0,
        totalSpend: profile.total_spend || 0
      });
    }

    // =============================================
    // STEP 3: MATCH USERS TO CAMPAIGNS
    // =============================================
    
    const deployments: any[] = [];
    let totalMatches = 0;
    
    for (const [userId, userMatrix] of matchMatrix.entries()) {
      const profile = profiles?.find(p => p.user_id === userId);
      if (!profile) continue;

      // Determine segment based on PTP score
      let segment = 'observe';
      if (userMatrix.ptpScore >= 80) segment = 'trigger';
      else if (userMatrix.ptpScore >= 50) segment = 'nurture';

      // Find matching campaigns
      const matchingCampaigns: CampaignMatch[] = [];
      
      for (const campaign of campaigns || []) {
        const conditions = campaign.trigger_conditions || {};
        let matches = true;

        // Check PTP range
        if (conditions.min_ptp && userMatrix.ptpScore < conditions.min_ptp) matches = false;
        if (conditions.max_ptp && userMatrix.ptpScore > conditions.max_ptp) matches = false;

        // Check segment match (unless custom)
        if (campaign.target_segment !== 'custom' && campaign.target_segment !== segment) matches = false;

        // Check behaviors (if required)
        if (conditions.behaviors) {
          const requiredBehaviors = Array.isArray(conditions.behaviors) ? conditions.behaviors : [conditions.behaviors];
          const hasBehavior = requiredBehaviors.some((b: string) => userMatrix.recentBehaviors.includes(b));
          if (!hasBehavior) matches = false;
        }

        // Check inactivity threshold
        if (conditions.inactive_days && userMatrix.inactiveDays < conditions.inactive_days) matches = false;

        if (matches) {
          // Personalize message
          const personalizedMessage = personalizeMessage(
            campaign.message_template,
            profile,
            userMatrix
          );

          matchingCampaigns.push({
            campaign,
            matchScore: userMatrix.ptpScore,
            personalizedMessage
          });
        }
      }

      // Deploy top 2 campaigns per user (prevent spam)
      const topCampaigns = matchingCampaigns
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 2);

      for (const match of topCampaigns) {
        const scheduledFor = new Date(now.getTime() + 5 * 60 * 1000); // 5 min delay

        deployments.push({
          campaign_id: match.campaign.id,
          user_id: userId,
          ptp_score: userMatrix.ptpScore,
          era_score: userMatrix.eraScore,
          segment,
          message_sent: match.personalizedMessage,
          channel: match.campaign.campaign_type,
          scheduled_for: scheduledFor.toISOString(),
          metadata: {
            behaviors: userMatrix.recentBehaviors,
            offer: match.campaign.offer_value,
            emotional_state: userMatrix.emotionalState
          }
        });

        totalMatches++;
      }

      // Update match matrix score
      const behavioralScore = Math.min(userMatrix.recentBehaviors.length * 2, 100);
      
      await supabase
        .from('match_matrix_scores')
        .upsert({
          user_id: userId,
          oracle_score: userMatrix.ptpScore,
          epiphany_score: userMatrix.eraScore,
          behavioral_score: behavioralScore,
          segment,
          recommended_actions: topCampaigns.map(c => ({
            campaign: c.campaign.campaign_type,
            message: c.personalizedMessage.substring(0, 100)
          })),
          last_updated: now.toISOString()
        });
    }

    // =============================================
    // STEP 4: QUEUE ALL DEPLOYMENTS
    // =============================================
    
    if (deployments.length > 0) {
      const { error: insertError } = await supabase
        .from('catalyst_executions')
        .insert(deployments);

      if (insertError) {
        console.error('[CATALYST] Insert error:', insertError);
        throw insertError;
      }
    }

    console.log(`[CATALYST] ✅ Deployed ${totalMatches} campaigns to ${deployments.length} executions`);

    // =============================================
    // STEP 5: RETURN SUMMARY
    // =============================================
    
    const summary = {
      totalProfiles: profiles?.length || 0,
      segmentation: {
        observe: Array.from(matchMatrix.values()).filter(m => m.ptpScore < 50).length,
        nurture: Array.from(matchMatrix.values()).filter(m => m.ptpScore >= 50 && m.ptpScore < 80).length,
        trigger: Array.from(matchMatrix.values()).filter(m => m.ptpScore >= 80).length
      },
      deploymentsScheduled: deployments.length,
      campaignsActivated: totalMatches,
      nextScheduledRun: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    };

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[CATALYST] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function personalizeMessage(
  template: string,
  profile: any,
  matrix: MatchMatrixInput
): string {
  let message = template
    .replace(/{first_name}/g, profile.first_name || 'Friend')
    .replace(/{email}/g, profile.email || '')
    .replace(/{ptp_score}/g, matrix.ptpScore.toString());

  return message;
}
