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
    const { campaignId } = await req.json();
    
    if (!campaignId) {
      throw new Error('campaignId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating AI targets for campaign:', campaignId);

    // Fetch campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    // Update campaign status to analyzing
    await supabase
      .from('marketing_campaigns')
      .update({ status: 'analyzing' })
      .eq('id', campaignId);

    // Fetch all user profiles with their PTP scores
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, email, ptp_score, ptp_status, latitude, longitude, membership_tier, tier, last_active_at')
      .not('ptp_score', 'is', null)
      .order('ptp_score', { ascending: false });

    if (usersError) throw usersError;

    console.log(`Found ${users?.length || 0} users with PTP scores`);

    // Use AI to analyze the campaign goal and provide targeting strategy
    const aiPrompt = `
You are an expert marketing strategist. Analyze this campaign goal and provide targeting recommendations:

Campaign Goal: ${campaign.goal}
Budget Tier: ${campaign.budget_tier}
Enabled Channels: ${JSON.stringify(campaign.enabled_channels)}
Duration: ${campaign.start_date} to ${campaign.end_date}

Available user segments:
- Green users (PTP 70-100): High engagement, likely to convert
- Yellow users (PTP 40-69): Moderate engagement, need nurturing
- Red users (PTP 0-39): Low engagement, high effort to convert

Provide a targeting strategy with:
1. Which PTP segments to target
2. Recommended message approach for each segment
3. Expected conversion estimates

Keep response concise and actionable.
`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: 'You are a marketing AI that provides concise, actionable targeting strategies.' },
          { role: 'user', content: aiPrompt }
        ],
        max_tokens: 500
      })
    });

    const aiData = await aiResponse.json();
    const aiStrategy = aiData.choices?.[0]?.message?.content || 'No strategy generated';

    console.log('AI Strategy:', aiStrategy);

    // Filter and score users based on budget tier and AI strategy
    let targetUsers = users || [];
    let minPtpScore = 0;

    if (campaign.budget_tier === 'minimal') {
      // Minimal: Only green users (70-100)
      targetUsers = targetUsers.filter(u => (u.ptp_score || 0) >= 70);
      minPtpScore = 70;
    } else if (campaign.budget_tier === 'moderate') {
      // Moderate: Green and yellow users (40-100)
      targetUsers = targetUsers.filter(u => (u.ptp_score || 0) >= 40);
      minPtpScore = 40;
    } else {
      // Aggressive: All users (0-100)
      minPtpScore = 0;
    }

    // Limit based on budget
    const maxTargets = campaign.budget_tier === 'minimal' ? 100 : 
                       campaign.budget_tier === 'moderate' ? 500 : 2000;
    
    targetUsers = targetUsers.slice(0, maxTargets);

    // Insert targets into database
    const targetInserts = targetUsers.map(user => ({
      campaign_id: campaignId,
      user_id: user.user_id,
      ptp_score: user.ptp_score || 0,
      ptp_status: user.ptp_status || 'red',
      personalization_data: {
        first_name: user.first_name,
        email: user.email,
        tier: user.membership_tier || user.tier,
        location: user.latitude && user.longitude ? { lat: user.latitude, lng: user.longitude } : null
      }
    }));

    const { error: insertError } = await supabase
      .from('campaign_targets_v2')
      .insert(targetInserts);

    if (insertError) throw insertError;

    // Calculate breakdown by PTP status
    const breakdown = {
      green: targetUsers.filter(u => (u.ptp_score || 0) >= 70).length,
      yellow: targetUsers.filter(u => (u.ptp_score || 0) >= 40 && (u.ptp_score || 0) < 70).length,
      red: targetUsers.filter(u => (u.ptp_score || 0) < 40).length
    };

    // Update campaign with results
    await supabase
      .from('marketing_campaigns')
      .update({
        status: 'active',
        performance_metrics: {
          targeted: targetUsers.length,
          breakdown,
          ai_strategy: aiStrategy,
          min_ptp_score: minPtpScore
        }
      })
      .eq('id', campaignId);

    console.log(`Generated ${targetUsers.length} targets for campaign ${campaignId}`);

    return new Response(
      JSON.stringify({
        success: true,
        campaignId,
        targetsGenerated: targetUsers.length,
        breakdown,
        aiStrategy,
        minPtpScore
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating AI targets:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
