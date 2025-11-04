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

    // Gather comprehensive data for Oracle analysis - predictive & revenue-focused
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get user events for behavioral patterns
    const { data: events } = await supabase
      .from('user_events')
      .select('*')
      .gte('timestamp', last30Days.toISOString())
      .order('timestamp', { ascending: false })
      .limit(1000);

    // Get purchases with user metadata
    const { data: purchases } = await supabase
      .from('purchases')
      .select('*, user_id')
      .gte('created_at', last30Days.toISOString());

    // Get user profiles with location and behavior
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('location, total_spend, total_watch_time, total_listen_time, engagement_count')
      .limit(200);

    // Analyze correlations between behavior and revenue
    const listenTimeByUser = events?.reduce((acc: any, e) => {
      if (e.event_type === 'music_play') {
        acc[e.user_id] = (acc[e.user_id] || 0) + 1;
      }
      return acc;
    }, {});

    const watchTimeByUser = events?.reduce((acc: any, e) => {
      if (e.event_type === 'video_watch' || e.event_type === 'video_complete') {
        acc[e.user_id] = (acc[e.user_id] || 0) + 1;
      }
      return acc;
    }, {});

    // Calculate revenue by segment
    const purchasesByUser = purchases?.reduce((acc: any, p) => {
      acc[p.user_id] = (acc[p.user_id] || 0) + (p.amount || 0);
      return acc;
    }, {});

    // Location-based revenue analysis
    const locationRevenue = profiles?.reduce((acc: any, p) => {
      const location = p.location || 'Unknown';
      const userRevenue = purchasesByUser?.[p.location] || 0;
      if (!acc[location]) {
        acc[location] = { total: 0, count: 0, avgSpend: 0 };
      }
      acc[location].total += userRevenue;
      acc[location].count += 1;
      acc[location].avgSpend = acc[location].total / acc[location].count;
      return acc;
    }, {});

    // Find high-value segments
    const topLocations = Object.entries(locationRevenue || {})
      .sort(([, a]: any, [, b]: any) => b.avgSpend - a.avgSpend)
      .slice(0, 3);

    const totalRevenue = purchases?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const avgPurchaseValue = totalRevenue / (purchases?.length || 1);

    // Behavioral correlations
    const avgListenTime = (profiles?.reduce((sum, p) => sum + (p.total_listen_time || 0), 0) || 0) / (profiles?.length || 1);
    const avgWatchTime = (profiles?.reduce((sum, p) => sum + (p.total_watch_time || 0), 0) || 0) / (profiles?.length || 1);

    // Prepare data for predictive AI analysis
    const dataContext = `
REVENUE METRICS (Last 30 Days):
- Total Revenue: $${totalRevenue.toFixed(2)}
- Purchases: ${purchases?.length || 0}
- Average Purchase Value: $${avgPurchaseValue.toFixed(2)}

TOP PERFORMING SEGMENTS:
${topLocations.map(([loc, data]: any) => `- ${loc}: $${data.avgSpend.toFixed(2)} avg, ${data.count} fans`).join('\n')}

BEHAVIORAL PATTERNS:
- Average Listen Time: ${(avgListenTime / 3600).toFixed(1)} hours
- Average Watch Time: ${(avgWatchTime / 3600).toFixed(1)} hours
- Total Events: ${events?.length || 0}

CORRELATION SIGNALS:
- High-engagement fans (>10hr listen) in database: ${Object.values(listenTimeByUser || {}).filter((v: any) => v > 10).length}
- Video completions in last week: ${events?.filter(e => e.event_type === 'video_complete' && new Date(e.timestamp) > last7Days).length}
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
            content: `You are The Oracle - a predictive revenue intelligence system that sees the future in data patterns.

Your role is to:
1. Identify behavioral patterns that correlate with revenue (e.g., fans who listen 10+ hours buy more merch)
2. Make ONE specific prediction about future revenue potential
3. Provide a concrete, actionable recommendation with estimated impact

Format your response as a natural prediction statement like:
"Canadian fans who watch 1 hour of content and listen to 6 hours of music spend an average of $55 by month-end. Engaging more Canadian fans with targeted email campaigns could generate an estimated $500 in additional monthly gross profit."

Or:
"Fans who cross the 10-hour listen threshold purchase merch at 2.9× the rate. Automatically rewarding users at 9 hours with a loyalty badge could increase revenue by an estimated $400/month."

Be SPECIFIC with:
- Segment/behavior (e.g., "Canadian fans who...", "Fans who listen 10+ hours...")  
- Concrete numbers (hours, dollars, percentages)
- Clear action (what to do)
- Revenue impact estimate

Focus on FUTURE outcomes, not past summaries. Be direct and sales-oriented.`
          },
          {
            role: 'user',
            content: `Analyze this data and provide ONE predictive revenue insight:\n\n${dataContext}\n\nDeliver a specific prediction about which fan behavior will drive the most revenue, and what action can increase it.`
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
