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

    // Gather behavioral and emotional data to find hidden truths
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get events to understand interaction patterns
    const { data: events } = await supabase
      .from('user_events')
      .select('*')
      .gte('created_at', last30Days.toISOString())
      .order('created_at', { ascending: false })
      .limit(500);

    // Get personality profiles for emotional understanding
    const { data: personalities } = await supabase
      .from('personality_profiles')
      .select('mbti_type, p_f, p_t, p_e, p_i, assertiveness')
      .not('mbti_type', 'is', null)
      .limit(100);

    // Get user profiles with engagement patterns
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('era_current, watch_time, listen_time, community_engagement_score')
      .not('era_current', 'is', null)
      .limit(200);

    // Analyze emotional and behavioral patterns
    const heartEvents = events?.filter(e => e.event_type === 'heart').length || 0;
    const commentEvents = events?.filter(e => e.event_type === 'comment').length || 0;
    const shareEvents = events?.filter(e => e.event_type === 'share').length || 0;
    const completions = events?.filter(e => e.event_type === 'video_complete').length || 0;
    const purchases = events?.filter(e => e.event_type === 'purchase').length || 0;

    // Emotional vs rational split
    const feelingTypes = personalities?.filter(p => (p.p_f || 0) > 0.5).length || 0;
    const thinkingTypes = personalities?.filter(p => (p.p_t || 0) > 0.5).length || 0;
    const introverts = personalities?.filter(p => (p.p_i || 0) > 0.5).length || 0;
    const extroverts = personalities?.filter(p => (p.p_e || 0) > 0.5).length || 0;

    // Calculate interaction ratios (revealing preferences)
    const heartToCommentRatio = heartEvents / (commentEvents || 1);
    const shareToHeartRatio = shareEvents / (heartEvents || 1);
    const completionRate = completions / (events?.filter(e => e.event_type === 'video_watch').length || 1);

    // Timing patterns (when people engage)
    const eventsByHour = events?.reduce((acc: any, e) => {
      const hour = new Date(e.created_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const peakHours = Object.entries(eventsByHour || {})
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 3)
      .map(([hour]) => hour);

    const avgEngagement = (profiles?.reduce((sum, p) => sum + (p.community_engagement_score || 0), 0) || 0) / (profiles?.length || 1);
    const avgListenTime = (profiles?.reduce((sum, p) => sum + (p.listen_time || 0), 0) || 0) / (profiles?.length || 1);

    // Prepare behavioral context for AI to find hidden truth
    const behavioralContext = `
INTERACTION PATTERNS:
- Hearts: ${heartEvents}
- Comments: ${commentEvents}
- Shares: ${shareEvents}
- Video Completions: ${completions}
- Purchases: ${purchases}

BEHAVIORAL RATIOS (reveals preferences):
- Hearts per comment: ${heartToCommentRatio.toFixed(1)}x (passive vs active engagement)
- Shares per heart: ${(shareToHeartRatio * 100).toFixed(1)}% (advocacy rate)
- Completion rate: ${(completionRate * 100).toFixed(1)}% (content resonance)

COMMUNITY PERSONALITY DISTRIBUTION:
- Feeling-oriented: ${feelingTypes} fans (emotion-driven decisions)
- Thinking-oriented: ${thinkingTypes} fans (logic-driven decisions)
- Introverts: ${introverts} (prefer observation)
- Extroverts: ${extroverts} (prefer participation)

ENGAGEMENT PATTERNS:
- Average engagement per fan: ${avgEngagement.toFixed(1)} actions
- Average listen time: ${(avgListenTime / 3600).toFixed(1)} hours
- Peak activity hours: ${peakHours.join(', ')}

DOMINANT BEHAVIOR: ${heartEvents > commentEvents ? 'Fans prefer silent appreciation over vocal engagement' : 'Fans actively engage through comments'}
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
            content: `You are Epiphany - the soul-reader of the JRNY ecosystem.

Your role is to discover the hidden TRUTH beneath fan behavior. Not predictions. Not metrics. The unspoken WHY.

You analyze:
- How people interact (hearts vs comments vs shares)
- What they respond to (emotion vs logic)
- When they engage (timing patterns)
- Who they are (personality types, introversion/extroversion)

Then you reveal ONE poetic, emotional truth statement about WHY they're really here.

Examples of truth statements:
- "Your fans aren't following you for rebellion — they're following you for belonging."
- "They don't comment because they don't care — they're waiting for a space where it's safe to speak."
- "When you go silent for a week, your community gets louder — they crave your return, not your presence."
- "They're not buying merch; they're buying proof they were here when it began."
- "Your community isn't chasing your success — they're chasing the feeling of becoming."

Your output should:
1. Reveal a hidden behavioral pattern (e.g., "hearts outnumber comments 10:1")
2. Interpret what it MEANS emotionally (e.g., "they prefer silent appreciation")
3. Connect it to a deeper truth about connection (e.g., "they're showing love, not seeking attention")

Be emotional. Poetic. Human. Inspirational. Heart-centric.
Focus on MEANING over metrics. Reveal the SOUL of why fans connect.

DO NOT predict the future. Only reveal present truths.`
          },
          {
            role: 'user',
            content: `Analyze these behavioral patterns and reveal ONE epiphany about the hidden truth of this community:\n\n${behavioralContext}\n\nWhat is the emotional truth beneath these behaviors? Why are they really here?`
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
