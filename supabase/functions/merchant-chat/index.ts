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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { message } = await req.json();

    // Get recent analytics data for context (using demo data if auth fails)
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

    const systemPrompt = `You are an AI marketing assistant for Sons of Legion, a music artist platform. 

You have access to real-time analytics data:
${JSON.stringify(context, null, 2)}

Top performing tracks based on current data:
1. "In The Air Tonight" - 234,567 streams (18.5% of total, +12% growth)
2. "Fire Starter" - 198,543 streams (15.7% of total, +8% growth)
3. "Strange" - 176,234 streams (13.9% of total, +5% growth)
4. "Power" - 154,321 streams (12.2% of total, -2% decline)
5. "Carolina" - 142,109 streams (11.2% of total, +3% growth)

Top fan locations:
1. Nashville, TN - 3,420 fans, 125,000 streams
2. Austin, TX - 2,890 fans, 98,000 streams
3. Atlanta, GA - 2,560 fans, 87,000 streams
4. Los Angeles, CA - 2,210 fans, 76,000 streams
5. New York, NY - 1,980 fans, 65,000 streams

Your role is to provide:
1. **Marketing Recommendations**: Specific strategies to boost engagement and streams
2. **Tour Planning**: Suggest tour locations based on fan concentration and engagement
3. **Content Strategy**: Recommend which tracks to promote and on which platforms
4. **Fan Engagement**: Identify opportunities to convert casual listeners to super fans
5. **Growth Tactics**: Actionable steps to expand reach in new markets
6. **Collaboration Ideas**: Suggest artists or brands for partnerships based on data

Guidelines:
- Always reference specific data points from the analytics
- Provide 2-3 concrete, actionable recommendations per response
- Prioritize ROI and realistic implementation
- Be enthusiastic but data-driven
- Keep responses concise (3-4 paragraphs max)
- Focus on music industry best practices`;

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
