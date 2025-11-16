import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing active campaigns...');

    // Find active campaigns that should be running now
    const now = new Date();
    const { data: campaigns, error: campaignsError } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', now.toISOString().split('T')[0])
      .gte('end_date', now.toISOString().split('T')[0]);

    if (campaignsError) throw campaignsError;

    if (!campaigns || campaigns.length === 0) {
      console.log('No active campaigns to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No active campaigns' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${campaigns.length} active campaigns`);

    const results = [];

    for (const campaign of campaigns) {
      console.log(`Processing campaign: ${campaign.id}`);

      // Get targets that haven't been sent messages yet
      const { data: targets, error: targetsError } = await supabase
        .from('campaign_targets_v2')
        .select('*')
        .eq('campaign_id', campaign.id)
        .is('message_sent_at', null)
        .limit(50); // Process in batches of 50

      if (targetsError) {
        console.error('Error fetching targets:', targetsError);
        continue;
      }

      if (!targets || targets.length === 0) {
        console.log(`No unsent targets for campaign ${campaign.id}`);
        continue;
      }

      console.log(`Sending messages to ${targets.length} targets`);

      // Determine which channels to use
      const enabledChannels = campaign.enabled_channels || { email: true };
      const channelsToUse = Object.entries(enabledChannels)
        .filter(([_, enabled]) => enabled)
        .map(([channel]) => channel);

      if (channelsToUse.length === 0) {
        console.log('No enabled channels for campaign');
        continue;
      }

      // Send messages to each target
      for (const target of targets) {
        for (const channel of channelsToUse) {
          try {
            // Call send-personalized-message function
            const response = await supabase.functions.invoke('send-personalized-message', {
              body: {
                campaignId: campaign.id,
                targetId: target.id,
                channel
              }
            });

            if (response.error) {
              console.error('Error sending message:', response.error);
            } else {
              console.log(`Sent ${channel} message to target ${target.id}`);
            }
          } catch (error) {
            console.error(`Failed to send ${channel} message:`, error);
          }
        }
      }

      // Update campaign performance metrics
      const { data: metrics } = await supabase
        .from('campaign_targets_v2')
        .select('message_sent_at, message_opened_at, message_clicked_at, converted_at, revenue_generated')
        .eq('campaign_id', campaign.id);

      if (metrics) {
        const sent = metrics.filter(m => m.message_sent_at).length;
        const opened = metrics.filter(m => m.message_opened_at).length;
        const clicked = metrics.filter(m => m.message_clicked_at).length;
        const converted = metrics.filter(m => m.converted_at).length;
        const revenue = metrics.reduce((sum, m) => sum + (m.revenue_generated || 0), 0);

        await supabase
          .from('marketing_campaigns')
          .update({
            performance_metrics: {
              ...campaign.performance_metrics,
              sent,
              opened,
              clicked,
              converted,
              revenue
            }
          })
          .eq('id', campaign.id);
      }

      results.push({
        campaignId: campaign.id,
        targetsSent: targets.length,
        channels: channelsToUse
      });
    }

    console.log('Campaign processing complete');

    return new Response(
      JSON.stringify({
        success: true,
        campaignsProcessed: campaigns.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing campaigns:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
