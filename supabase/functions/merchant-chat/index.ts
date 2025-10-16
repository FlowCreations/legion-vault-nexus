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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { message } = await req.json();

    // Get recent analytics data for context
    const { data: events } = await supabaseClient
      .from('user_events')
      .select('event_type, created_at, page_url')
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: analytics } = await supabaseClient
      .from('user_analytics')
      .select('*')
      .order('engagement_score', { ascending: false })
      .limit(20);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Prepare context for AI
    const context = {
      totalEvents: events?.length || 0,
      totalUsers: analytics?.length || 0,
      superFans: analytics?.filter(a => a.is_super_fan).length || 0,
      averageEngagement: analytics?.reduce((sum, a) => sum + (a.engagement_score || 0), 0) / (analytics?.length || 1),
      recentActivity: events?.slice(0, 10).map(e => ({
        type: e.event_type,
        page: e.page_url,
        time: e.created_at
      })),
      topUsers: analytics?.slice(0, 5).map(a => ({
        engagement: a.engagement_score,
        visits: a.total_visits,
        purchases: a.total_purchases,
        isSuperFan: a.is_super_fan
      }))
    };

    const systemPrompt = `You are an AI assistant for the Sons of Legion music platform merchant dashboard. 

You have access to real-time analytics data:
${JSON.stringify(context, null, 2)}

Your role is to:
- Answer questions about fan engagement and platform metrics
- Provide actionable marketing insights
- Suggest strategies to increase fan engagement and conversions
- Help identify super fans and high-value users
- Recommend tour locations based on fan distribution
- Suggest collaboration opportunities

Be conversational, insightful, and data-driven. Keep responses concise but actionable.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Merchant chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
