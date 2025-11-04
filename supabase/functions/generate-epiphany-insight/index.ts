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
      Deno.env.get('VITE_SUPABASE_URL') ?? '',
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

    // Gather emotional and resonance data
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get events with emotional signals
    const { data: events } = await supabase
      .from('user_events')
      .select('*')
      .gte('timestamp', last7Days.toISOString())
      .in('event_type', ['heart', 'comment', 'share', 'video_complete', 'purchase'])
      .order('timestamp', { ascending: false })
      .limit(200);

    // Get personality profiles for emotional understanding
    const { data: personalities } = await supabase
      .from('personality_profiles')
      .select('mbti_type, p_f, p_t, feature_vector')
      .not('mbti_type', 'is', null)
      .limit(50);

    // Get user profiles with engagement patterns
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('era_score, total_watch_time, engagement_count')
      .not('era_score', 'is', null)
      .limit(100);

    // Analyze emotional patterns
    const heartEvents = events?.filter(e => e.event_type === 'heart').length || 0;
    const commentEvents = events?.filter(e => e.event_type === 'comment').length || 0;
    const shareEvents = events?.filter(e => e.event_type === 'share').length || 0;
    const completions = events?.filter(e => e.event_type === 'video_complete').length || 0;

    // Personality insights
    const feelingTypes = personalities?.filter(p => (p.p_f || 0) > 0.5).length || 0;
    const thinkingTypes = personalities?.filter(p => (p.p_t || 0) > 0.5).length || 0;

    const avgEngagement = (profiles?.reduce((sum, p) => sum + (p.engagement_count || 0), 0) || 0) / (profiles?.length || 1);

    // Prepare emotional context for AI
    const emotionalContext = `
Emotional Signals:
- Hearts: ${heartEvents}
- Comments: ${commentEvents} 
- Shares: ${shareEvents}
- Video Completions: ${completions}

Community Personality:
- Feeling-oriented fans: ${feelingTypes}
- Thinking-oriented fans: ${thinkingTypes}
- Average engagement per fan: ${avgEngagement.toFixed(1)}

Recent emotional events: ${events?.slice(0, 5).map(e => e.event_type).join(', ')}
    `.trim();

    // Call Lovable AI for emotional insight
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
            content: 'You are Epiphany - a creative spark that reveals emotional truths. You analyze fan behavior to surface ONE poetic, heart-centered revelation about why audiences connect and how to deepen it. Be emotional, human, inspirational. Focus on meaning over metrics. Reveal the soul of the connection.'
          },
          {
            role: 'user',
            content: `Analyze these emotional signals and reveal ONE epiphany about the heart of this fan connection:\n\n${emotionalContext}\n\nFormat: One poetic insight that connects emotion to action. Make it feel like an "aha moment" about love, meaning, and resonance.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const insight = aiData.choices[0].message.content;

    console.log('[EPIPHANY] Generated insight:', insight);

    return new Response(
      JSON.stringify({ insight }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[EPIPHANY] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
