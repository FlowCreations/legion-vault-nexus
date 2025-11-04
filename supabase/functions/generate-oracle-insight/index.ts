import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Gather comprehensive data for Oracle analysis
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get recent user events
    const { data: events } = await supabase
      .from('user_events')
      .select('*')
      .gte('timestamp', last7Days.toISOString())
      .order('timestamp', { ascending: false })
      .limit(500);

    // Get purchases
    const { data: purchases } = await supabase
      .from('purchases')
      .select('*')
      .gte('created_at', last7Days.toISOString());

    // Get user profiles with ERA/PTP scores
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('era_score, ptp_score, total_spend, personality_mbti')
      .not('era_score', 'is', null)
      .limit(100);

    // Get personality profiles
    const { data: personalities } = await supabase
      .from('personality_profiles')
      .select('mbti_type, confidence_score')
      .not('mbti_type', 'is', null)
      .limit(50);

    // Analyze the data
    const eventTypes = events?.reduce((acc: any, e) => {
      acc[e.event_type] = (acc[e.event_type] || 0) + 1;
      return acc;
    }, {});

    const recentEngagement = events?.filter(e => 
      new Date(e.timestamp) > last24Hours
    ).length || 0;

    const totalRevenue = purchases?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const avgERA = (profiles?.reduce((sum, p) => sum + (p.era_score || 0), 0) || 0) / (profiles?.length || 1);
    const avgPTP = (profiles?.reduce((sum, p) => sum + (p.ptp_score || 0), 0) || 0) / (profiles?.length || 1);

    // Prepare data for AI analysis
    const dataContext = `
Sales Data: ${purchases?.length || 0} purchases in last 7 days, $${totalRevenue.toFixed(2)} revenue
Engagement: ${recentEngagement} events in last 24 hours, ${events?.length || 0} total events in 7 days
Event Types: ${JSON.stringify(eventTypes)}
Average ERA Score: ${avgERA.toFixed(1)}
Average PTP Score: ${avgPTP.toFixed(1)}
Top Personality Types: ${personalities?.map(p => p.mbti_type).slice(0, 5).join(', ')}
    `.trim();

    // Call Lovable AI for strategic insight
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are the Oracle - a strategic intelligence system that synthesizes data into ONE powerful, actionable insight. Your insights are data-driven, predictive, and designed to change the next 24 hours. Be specific, use numbers, and focus on immediate action.'
          },
          {
            role: 'user',
            content: `Analyze this fan data and provide ONE strategic insight that will change the next 24 hours:\n\n${dataContext}\n\nFormat: One sentence that connects specific data points to a clear next action.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const insight = aiData.choices[0].message.content;

    console.log('[ORACLE] Generated insight:', insight);

    return new Response(
      JSON.stringify({ insight }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[ORACLE] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
