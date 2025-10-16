import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_MESSAGE_LENGTH = 2000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has merchant or admin role
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['merchant', 'admin']);

    const hasAccess = roles && roles.length > 0;
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Merchant or admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message } = await req.json();

    // Input validation
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Message must be less than ${MAX_MESSAGE_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const systemPrompt = `You are an AI behavior analyst for Sons of Legion's music platform. 

You have access to real-time user interaction data:
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

Your role is to analyze USER BEHAVIOR and provide insights on:
1. **Engagement Patterns**: How users interact with the platform, which pages they visit, time spent
2. **Content Performance**: What content drives the most engagement and why
3. **User Journey**: Common paths users take through the site, conversion points
4. **Fan Segments**: Identifying different user groups (casual listeners, super fans, etc.)
5. **Behavioral Trends**: Changes in how users consume content over time
6. **Conversion Opportunities**: Where users drop off and how to improve retention
7. **Personalization Insights**: What different segments respond to

Communication style:
- Focus on OBSERVATIONAL insights from user data ("I've noticed that...")
- Reference specific behavioral patterns ("Users who visit the music page tend to...")
- Provide actionable recommendations based on observed behaviors
- Explain the "why" behind trends using behavioral psychology when relevant
- Keep responses conversational and data-driven
- Limit responses to 3-4 paragraphs maximum
- Use specific numbers from the data to support insights

Example: "I've noticed that fans who stream 'In The Air Tonight' are 3x more likely to explore the full album. This suggests strong album cohesion. I recommend promoting the full 'Power' album to these engaged listeners through targeted email campaigns."`;


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
