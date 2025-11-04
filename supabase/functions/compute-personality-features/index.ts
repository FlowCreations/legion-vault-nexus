import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FeatureWindow {
  time_window: '24h' | '7d' | '28d' | 'lifetime';
  hours: number;
}

const WINDOWS: FeatureWindow[] = [
  { time_window: '24h', hours: 24 },
  { time_window: '7d', hours: 168 },
  { time_window: '28d', hours: 672 },
  { time_window: 'lifetime', hours: 999999 },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('VITE_SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const features: any[] = [];
    const now = new Date();

    for (const { time_window, hours } of WINDOWS) {
      const windowStart = new Date(now.getTime() - hours * 60 * 60 * 1000);

      // Get events in this window
      const { data: events } = await supabase
        .from('user_events')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', windowStart.toISOString());

      if (!events || events.length === 0) continue;

      // Engagement Tempo Features (J vs P)
      const sessionLengths = events
        .filter((e) => e.event_type === 'page_view')
        .map((e) => e.duration || 0);
      
      const avgSessionLength = sessionLengths.length > 0
        ? sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length
        : 0;

      const variance = sessionLengths.length > 1
        ? sessionLengths.reduce((sum, val) => sum + Math.pow(val - avgSessionLength, 2), 0) / sessionLengths.length
        : 0;

      features.push(
        { user_id: userId, feature_name: 'avg_session_length', value: avgSessionLength, time_window },
        { user_id: userId, feature_name: 'session_variance', value: variance, time_window }
      );

      // Content Preference Features (N vs S)
      const videoEvents = events.filter((e) => e.event_type === 'video_complete' || e.event_type === 'video_view');
      const longFormViews = videoEvents.filter((e) => (e.metadata?.duration || 0) > 300).length;
      const shortFormViews = videoEvents.filter((e) => (e.metadata?.duration || 0) <= 120).length;
      
      const longFormRatio = (longFormViews + shortFormViews) > 0
        ? longFormViews / (longFormViews + shortFormViews)
        : 0.5;

      features.push(
        { user_id: userId, feature_name: 'long_form_ratio', value: longFormRatio, time_window }
      );

      // Social Signals (F vs T, E vs I)
      const comments = events.filter((e) => e.event_type === 'comment').length;
      const shares = events.filter((e) => e.event_type === 'share').length;
      const hearts = events.filter((e) => e.event_type === 'heart').length;

      const commentFreq = comments / Math.max(events.length, 1);
      const shareFreq = shares / Math.max(events.length, 1);

      features.push(
        { user_id: userId, feature_name: 'comment_frequency', value: commentFreq, time_window },
        { user_id: userId, feature_name: 'share_frequency', value: shareFreq, time_window },
        { user_id: userId, feature_name: 'heart_frequency', value: hearts / Math.max(events.length, 1), time_window }
      );

      // Rational Signals (T tilt)
      const faqClicks = events.filter((e) => 
        e.event_type === 'page_view' && 
        (e.page_url?.includes('faq') || e.page_url?.includes('policy') || e.page_url?.includes('shipping'))
      ).length;

      features.push(
        { user_id: userId, feature_name: 'rational_clicks', value: faqClicks / Math.max(events.length, 1), time_window }
      );

      // Exploration vs Routine (N vs S, P)
      const uniquePages = new Set(events.map((e) => e.page_url)).size;
      const explorationIndex = uniquePages / Math.max(events.length, 1);

      features.push(
        { user_id: userId, feature_name: 'exploration_index', value: explorationIndex, time_window }
      );

      // Decision Latency (J vs P, T vs F)
      const firstView = events.find((e) => e.event_type === 'page_view');
      const firstPurchase = events.find((e) => e.event_type === 'purchase');
      
      if (firstView && firstPurchase) {
        const latency = (new Date(firstPurchase.timestamp).getTime() - new Date(firstView.timestamp).getTime()) / 1000;
        features.push(
          { user_id: userId, feature_name: 'decision_latency', value: latency, time_window }
        );
      }
    }

    // Insert features
    const { error: insertError } = await supabase
      .from('personality_features')
      .upsert(features.map((f) => ({ ...f, computed_at: new Date().toISOString() })), {
        onConflict: 'user_id,feature_name,time_window',
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, featuresComputed: features.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error computing features:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
