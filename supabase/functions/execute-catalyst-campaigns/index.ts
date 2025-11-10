import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[CATALYST-WORKER] Starting campaign execution...');

    // =============================================
    // STEP 1: FETCH PENDING EXECUTIONS
    // =============================================
    
    const now = new Date();
    
    const { data: executions, error: fetchError } = await supabase
      .from('catalyst_executions')
      .select(`
        *,
        campaign:catalyst_campaigns(*)
      `)
      .is('sent_at', null)
      .lte('scheduled_for', now.toISOString())
      .limit(100);

    if (fetchError) throw fetchError;

    console.log(`[CATALYST-WORKER] Found ${executions?.length || 0} pending executions`);

    let sent = 0;
    let failed = 0;

    // =============================================
    // STEP 2: SEND MESSAGES
    // =============================================
    
    for (const execution of executions || []) {
      try {
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(execution.user_id);
        if (!userData?.user?.email) {
          console.error(`[CATALYST-WORKER] No email for user ${execution.user_id}`);
          failed++;
          continue;
        }

        const userEmail = userData.user.email;

        // Send based on channel
        if (execution.channel === 'email') {
          // Send email via Resend
          const resendApiKey = Deno.env.get('RESEND_API_KEY');
          if (!resendApiKey) {
            console.error('[CATALYST-WORKER] RESEND_API_KEY not set');
            failed++;
            continue;
          }

          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'JRNY <noreply@jrny.com>',
              to: [userEmail],
              subject: getSubjectLine(execution.campaign, execution.metadata),
              html: execution.message_sent,
            }),
          });

          if (!emailResponse.ok) {
            const error = await emailResponse.text();
            console.error(`[CATALYST-WORKER] Email send failed: ${error}`);
            failed++;
            continue;
          }

          console.log(`[CATALYST-WORKER] Email sent to ${userEmail}`);
        } else if (execution.channel === 'notification') {
          // Store as in-app notification
          await supabase
            .from('community_posts')
            .insert({
              user_id: null, // System message
              content: execution.message_sent,
              post_type: 'notification',
              category: 'system',
              tagged_all: false
            });

          console.log(`[CATALYST-WORKER] Notification created for user ${execution.user_id}`);
        }

        // Update execution status
        await supabase
          .from('catalyst_executions')
          .update({ sent_at: now.toISOString() })
          .eq('id', execution.id);

        sent++;

      } catch (error: any) {
        console.error(`[CATALYST-WORKER] Error sending execution ${execution.id}:`, error);
        failed++;
      }
    }

    // =============================================
    // STEP 3: UPDATE PERFORMANCE METRICS
    // =============================================
    
    const campaignIds = [...new Set(executions?.map(e => e.campaign_id) || [])];
    
    for (const campaignId of campaignIds) {
      if (!campaignId) continue;

      const { data: stats } = await supabase
        .from('catalyst_executions')
        .select('sent_at, opened_at, clicked_at, converted_at, conversion_value')
        .eq('campaign_id', campaignId)
        .not('sent_at', 'is', null);

      if (stats && stats.length > 0) {
        const totalSent = stats.length;
        const totalOpened = stats.filter(s => s.opened_at).length;
        const totalClicked = stats.filter(s => s.clicked_at).length;
        const totalConverted = stats.filter(s => s.converted_at).length;
        const totalRevenue = stats.reduce((sum, s) => sum + (s.conversion_value || 0), 0);

        await supabase
          .from('catalyst_performance')
          .upsert({
            campaign_id: campaignId,
            date: now.toISOString().split('T')[0],
            total_sent: totalSent,
            total_opened: totalOpened,
            total_clicked: totalClicked,
            total_converted: totalConverted,
            total_revenue: totalRevenue,
            avg_conversion_value: totalConverted > 0 ? totalRevenue / totalConverted : 0,
            open_rate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
            click_rate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
            conversion_rate: totalSent > 0 ? (totalConverted / totalSent) * 100 : 0,
            updated_at: now.toISOString()
          });
      }
    }

    console.log(`[CATALYST-WORKER] ✅ Sent: ${sent}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({ success: true, sent, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[CATALYST-WORKER] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getSubjectLine(campaign: any, metadata: any): string {
  if (campaign.offer_type === 'discount') {
    return `🎵 Special Offer Just For You`;
  } else if (campaign.offer_type === 'exclusive_content') {
    return `🎸 Exclusive Content Unlocked`;
  } else if (campaign.offer_type === 'early_access') {
    return `🎟️ VIP Early Access`;
  }
  return `✨ Message from JRNY`;
}
