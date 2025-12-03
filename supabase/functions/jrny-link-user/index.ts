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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      jrny_id,
      user_id,
      email,
      auth_event
    } = await req.json();

    if (!jrny_id || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing jrny_id or user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[JRNY-LINK] Request:', { jrny_id, user_id, auth_event });

    // Get current visitor
    const { data: visitor } = await supabase
      .from('jrny_visitors')
      .select('*')
      .eq('jrny_id', jrny_id)
      .single();

    if (!visitor) {
      // Create visitor record if it doesn't exist
      await supabase.from('jrny_visitors').insert({
        jrny_id,
        email,
        converted_user_id: user_id,
        identity_revealed_at: new Date().toISOString(),
      });
    } else {
      // Update visitor with user link
      await supabase
        .from('jrny_visitors')
        .update({
          converted_user_id: user_id,
          email: email || visitor.email,
          identity_revealed_at: visitor.identity_revealed_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('jrny_id', jrny_id);
    }

    // Update user profile with jrny_member_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('jrny_member_id, watch_time, listen_time')
      .eq('user_id', user_id)
      .single();

    let finalJrnyId = jrny_id;

    if (profile) {
      // Only update if not already linked to a different jrny_id
      if (!profile.jrny_member_id || profile.jrny_member_id === jrny_id) {
        await supabase
          .from('user_profiles')
          .update({ jrny_member_id: jrny_id })
          .eq('user_id', user_id);
      } else {
        // User already has a jrny_id - merge the visitor profiles
        console.log('[JRNY-LINK] User already linked to:', profile.jrny_member_id);
        finalJrnyId = profile.jrny_member_id;
        
        // Merge current visitor into existing profile
        const { data: existingVisitor } = await supabase
          .from('jrny_visitors')
          .select('*')
          .eq('jrny_id', profile.jrny_member_id)
          .single();

        if (existingVisitor && visitor) {
          const existingScore = (existingVisitor.engagement_score as number) || 0;
          const visitorScore = (visitor.engagement_score as number) || 0;
          const existingPageViews = (existingVisitor.total_page_views as number) || 0;
          const visitorPageViews = (visitor.total_page_views as number) || 0;
          const existingSessions = (existingVisitor.total_sessions as number) || 0;
          const visitorSessions = (visitor.total_sessions as number) || 0;
          
          const mergedScore = existingScore + visitorScore;
          const existingPortals = (existingVisitor.portals_visited as string[]) || [];
          const visitorPortals = (visitor.portals_visited as string[]) || [];
          const mergedPortals = [...new Set([...existingPortals, ...visitorPortals])];

          await supabase
            .from('jrny_visitors')
            .update({
              engagement_score: mergedScore,
              portals_visited: mergedPortals,
              total_page_views: existingPageViews + visitorPageViews,
              total_sessions: existingSessions + visitorSessions,
              updated_at: new Date().toISOString(),
            })
            .eq('jrny_id', profile.jrny_member_id);

          // Move events
          await supabase
            .from('jrny_events')
            .update({ jrny_id: profile.jrny_member_id })
            .eq('jrny_id', jrny_id);

          // Update fingerprint mappings
          await supabase
            .from('jrny_fingerprint_map')
            .update({ jrny_id: profile.jrny_member_id })
            .eq('jrny_id', jrny_id);

          // Delete duplicate visitor
          await supabase
            .from('jrny_visitors')
            .delete()
            .eq('jrny_id', jrny_id);
        }
      }
    }

    // Track the link event
    await supabase.from('jrny_events').insert({
      jrny_id: finalJrnyId,
      event_type: auth_event === 'signup' ? 'user_signup' : 'user_login',
      event_data: { user_id, auth_event },
    });

    // Sync visitor stats to user profile if this is the primary link
    if (visitor && (!profile?.jrny_member_id || profile.jrny_member_id === jrny_id)) {
      // Calculate total engagement time from events
      const { data: watchEvents } = await supabase
        .from('jrny_events')
        .select('event_data')
        .eq('jrny_id', jrny_id)
        .eq('event_type', 'video_watch');

      const { data: listenEvents } = await supabase
        .from('jrny_events')
        .select('event_data')
        .eq('jrny_id', jrny_id)
        .eq('event_type', 'music_play');

      const totalWatchTime = watchEvents?.reduce((sum, e) => {
        const data = e.event_data as Record<string, unknown>;
        return sum + ((data?.duration as number) || 0);
      }, 0) || 0;
      
      const totalListenTime = listenEvents?.reduce((sum, e) => {
        const data = e.event_data as Record<string, unknown>;
        return sum + ((data?.duration as number) || 0);
      }, 0) || 0;

      if (totalWatchTime > 0 || totalListenTime > 0) {
        const currentWatchTime = (profile?.watch_time as number) || 0;
        const currentListenTime = (profile?.listen_time as number) || 0;
        
        await supabase
          .from('user_profiles')
          .update({
            watch_time: currentWatchTime + totalWatchTime,
            listen_time: currentListenTime + totalListenTime,
          })
          .eq('user_id', user_id);
      }
    }

    console.log('[JRNY-LINK] Success:', { finalJrnyId, user_id });

    return new Response(
      JSON.stringify({
        success: true,
        jrny_id: finalJrnyId,
        user_id,
        merged: profile?.jrny_member_id && profile.jrny_member_id !== jrny_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[JRNY-LINK] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
