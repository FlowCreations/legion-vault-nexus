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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id } = await req.json();

    console.log('Computing analytics for user:', user_id);

    // Get all events for this user
    const { data: events, error: eventsError } = await supabaseClient
      .from('user_events')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (eventsError) throw eventsError;

    // Calculate aggregated metrics
    let totalWatchTime = 0;
    let totalListenTime = 0;
    let totalPageViews = 0;
    let videoViewCount = 0;
    let musicPlayCount = 0;

    events?.forEach(event => {
      const duration = event.event_data?.duration || 0;
      
      if (event.event_type === 'video_watch' || event.event_type === 'video_view') {
        totalWatchTime += duration;
        videoViewCount++;
      } else if (event.event_type === 'music_listen' || event.event_type === 'music_play') {
        totalListenTime += duration;
        musicPlayCount++;
      } else if (event.event_type === 'page_view') {
        totalPageViews++;
      }
    });

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    // Update user_profiles with aggregated data
    const { error: updateError } = await supabaseClient
      .from('user_profiles')
      .update({
        watch_time: totalWatchTime,
        listen_time: totalListenTime,
        last_login: new Date().toISOString()
      })
      .eq('user_id', user_id);

    if (updateError) throw updateError;

    // Update user_analytics
    const { error: analyticsError } = await supabaseClient
      .from('user_analytics')
      .upsert({
        user_id: user_id,
        total_visits: totalPageViews,
        last_activity: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (analyticsError) throw analyticsError;

    // Trigger ERA/PTP recalculation
    try {
      await supabaseClient.functions.invoke('compute-era-ptp', {
        body: { member_id: user_id }
      });
    } catch (eraError) {
      console.error('ERA/PTP calculation failed:', eraError);
      // Don't fail the whole request if ERA/PTP fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analytics: {
          totalWatchTime,
          totalListenTime,
          totalPageViews,
          videoViewCount,
          musicPlayCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error computing analytics:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
