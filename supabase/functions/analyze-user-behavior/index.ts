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

    // Get recent user events
    const { data: events, error: eventsError } = await supabaseClient
      .from('user_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (eventsError) throw eventsError;

    // Get user analytics
    const { data: analytics, error: analyticsError } = await supabaseClient
      .from('user_analytics')
      .select('*')
      .order('engagement_score', { ascending: false });

    if (analyticsError) throw analyticsError;

    // Prepare AI analysis request
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const eventSummary = events?.slice(0, 100).map(e => ({
      type: e.event_type,
      page: e.page_url,
      time: e.created_at
    }));

    const prompt = `Analyze this user behavior data and provide insights:
    
Recent Events (last 100):
${JSON.stringify(eventSummary, null, 2)}

User Analytics Summary:
- Total users tracked: ${analytics?.length || 0}
- Super fans: ${analytics?.filter(a => a.is_super_fan).length || 0}
- Average engagement score: ${analytics?.reduce((sum, a) => sum + (a.engagement_score || 0), 0) / (analytics?.length || 1)}

Provide:
1. Key behavioral patterns
2. Engagement insights
3. Recommendations for increasing conversions
4. Fan segmentation opportunities
5. Potential super fans to target
6. Geographic distribution insights

Format as JSON with these keys: patterns, insights, recommendations, segments, targets, geographic`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert music platform analytics AI. Provide actionable insights in valid JSON format.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    // Try to parse JSON from the response
    let analysis;
    try {
      // Extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || 
                       analysisText.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : analysisText;
      analysis = JSON.parse(jsonStr);
    } catch (e) {
      // If parsing fails, return the raw text
      analysis = {
        patterns: [analysisText],
        insights: [],
        recommendations: [],
        segments: [],
        targets: [],
        geographic: {}
      };
    }

    return new Response(
      JSON.stringify({
        events: events?.length || 0,
        analytics: analytics?.length || 0,
        superFans: analytics?.filter(a => a.is_super_fan).length || 0,
        analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
