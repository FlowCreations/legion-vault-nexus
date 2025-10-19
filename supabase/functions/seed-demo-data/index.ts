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

    // Get all user profiles
    const { data: profiles } = await supabaseClient
      .from('user_profiles')
      .select('user_id, display_name');

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No profiles found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const eventTypes = [
      'watch_start', 'watch_complete', 'listen_start', 'listen_complete',
      'page_view', 'reaction', 'comment', 'add_to_cart'
    ];

    // Seed events for each user
    const eventPromises = profiles.map(async (profile) => {
      const numEvents = Math.floor(Math.random() * 30) + 10; // 10-40 events per user
      const events = [];

      for (let i = 0; i < numEvents; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const ts = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const sentiment = eventType === 'comment' || eventType === 'reaction' 
          ? (Math.random() * 2 - 1) // -1 to 1
          : null;

        events.push({
          member_id: profile.user_id,
          type: eventType,
          content_id: `content_${Math.floor(Math.random() * 20)}`,
          duration_sec: ['watch_complete', 'listen_complete'].includes(eventType) 
            ? Math.floor(Math.random() * 3600) + 60 
            : null,
          sentiment,
          click_latency_ms: Math.floor(Math.random() * 2000) + 100,
          ts: ts.toISOString(),
          value: eventType === 'add_to_cart' ? Math.random() * 100 : 0,
          meta: { demo: true }
        });
      }

      return supabaseClient.from('events').insert(events);
    });

    await Promise.all(eventPromises);

    // Update profiles with ERA/PTP scores
    const updatePromises = profiles.map(async (profile) => {
      const era = Math.floor(Math.random() * 10) + 1; // 1-10
      const ptp = Math.floor(Math.random() * 100); // 0-100
      
      let eraLabel = 'Dormant';
      if (era > 3 && era <= 6) eraLabel = 'Engaged';
      else if (era > 6 && era <= 8) eraLabel = 'Tribe';
      else if (era > 8) eraLabel = 'Integrated';
      
      let ptpStatus = 'Cold';
      if (ptp >= 40 && ptp < 70) ptpStatus = 'Warm';
      else if (ptp >= 70) ptpStatus = 'Hot';

      // Update profile
      await supabaseClient
        .from('user_profiles')
        .update({
          era_current: era,
          ptp_current: ptp,
          era_label: eraLabel,
          ptp_status: ptpStatus
        })
        .eq('user_id', profile.user_id);

      // Insert daily score
      return supabaseClient
        .from('era_ptp_scores_daily')
        .insert({
          member_id: profile.user_id,
          date: now.toISOString().split('T')[0],
          era,
          ptp,
          era_components: {
            c1: Math.random() * 100,
            c2: Math.random() * 100,
            c3: Math.random() * 100,
            c4: Math.random() * 100,
            c5: Math.random() * 100,
            c6: Math.random() * 100
          },
          ptp_components: { demo: true }
        });
    });

    await Promise.all(updatePromises);

    // Create sample cohorts
    await supabaseClient.from('cohorts').insert([
      {
        name: 'Night Owls',
        definition: { time_range: '22:00-04:00', engagement: 'high' }
      },
      {
        name: 'Concert-First',
        definition: { content_type: 'live_shows', frequency: 'weekly' }
      },
      {
        name: 'Long-Form Documentaries',
        definition: { content_type: 'documentaries', duration: '>60min' }
      }
    ]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        profiles: profiles.length,
        message: 'Demo data seeded successfully'
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
