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
    const { campaignId, targetId, channel } = await req.json();
    
    if (!campaignId || !targetId || !channel) {
      throw new Error('campaignId, targetId, and channel are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Sending personalized ${channel} message for target:`, targetId);

    // Fetch campaign and target details
    const { data: campaign, error: campaignError } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    const { data: target, error: targetError } = await supabase
      .from('campaign_targets_v2')
      .select('*')
      .eq('id', targetId)
      .single();

    if (targetError) throw targetError;

    // Generate personalized message using AI
    const personalizationData = target.personalization_data || {};
    const aiPrompt = `
Generate a personalized ${channel} message for this marketing campaign.

Campaign Goal: ${campaign.goal}
Recipient PTP Status: ${target.ptp_status} (Score: ${target.ptp_score}/100)
Recipient Name: ${personalizationData.first_name || 'there'}
Recipient Tier: ${personalizationData.tier || 'free'}

${channel === 'email' ? 'Create: Subject line and email body (HTML)' : ''}
${channel === 'sms' ? 'Create: SMS message (max 160 characters)' : ''}
${channel === 'inbox' ? 'Create: In-app message title and body' : ''}
${channel === 'popup' ? 'Create: Popup notification title and body' : ''}

Make it engaging, personal, and aligned with the campaign goal. Use their name naturally.

Return ONLY valid JSON in this format:
{
  "subject": "...",
  "body": "...",
  "cta": "..."
}
`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: 'You are a marketing copywriter. Always respond with valid JSON only.' },
          { role: 'user', content: aiPrompt }
        ],
        max_tokens: 400
      })
    });

    const aiData = await aiResponse.json();
    let messageContent;
    
    try {
      const aiText = aiData.choices?.[0]?.message?.content || '{}';
      messageContent = JSON.parse(aiText);
    } catch (e) {
      // Fallback if AI doesn't return valid JSON
      messageContent = {
        subject: campaign.goal.substring(0, 50),
        body: `Hi ${personalizationData.first_name || 'there'}! ${campaign.goal}`,
        cta: 'Learn More'
      };
    }

    console.log('Generated message:', messageContent);

    // Log the message
    const { error: logError } = await supabase
      .from('campaign_message_log')
      .insert({
        campaign_id: campaignId,
        user_id: target.user_id,
        channel,
        message_content: messageContent,
        status: 'sent'
      });

    if (logError) throw logError;

    // Update target with sent timestamp
    const { error: updateError } = await supabase
      .from('campaign_targets_v2')
      .update({ message_sent_at: new Date().toISOString() })
      .eq('id', targetId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        messageContent,
        channel,
        targetId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error sending personalized message:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
