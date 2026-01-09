import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[CLEANUP-STALE-STREAMS] Starting cleanup process');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all live events with stale heartbeat (no heartbeat in last 2 minutes)
    // OR events with no heartbeat that haven't been updated in 5 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    // First, find events with stale heartbeat
    const { data: staleHeartbeatEvents, error: heartbeatFetchError } = await supabase
      .from('livestream_events')
      .select('id, title, last_heartbeat, updated_at')
      .eq('status', 'live')
      .not('last_heartbeat', 'is', null)
      .lt('last_heartbeat', twoMinutesAgo);

    if (heartbeatFetchError) {
      console.error('[CLEANUP-STALE-STREAMS] Error fetching stale heartbeat events:', heartbeatFetchError);
      throw heartbeatFetchError;
    }

    // Then, find events with no heartbeat that are stale based on updated_at
    const { data: noHeartbeatEvents, error: noHeartbeatFetchError } = await supabase
      .from('livestream_events')
      .select('id, title, last_heartbeat, updated_at')
      .eq('status', 'live')
      .is('last_heartbeat', null)
      .lt('updated_at', fiveMinutesAgo);

    if (noHeartbeatFetchError) {
      console.error('[CLEANUP-STALE-STREAMS] Error fetching no-heartbeat events:', noHeartbeatFetchError);
      throw noHeartbeatFetchError;
    }

    const staleEvents = [...(staleHeartbeatEvents || []), ...(noHeartbeatEvents || [])];
    console.log(`[CLEANUP-STALE-STREAMS] Found ${staleEvents.length} stale events`);

    if (staleEvents.length > 0) {
      const staleIds = staleEvents.map(e => e.id);
      
      // Update all stale events to 'ended'
      const { error: updateError } = await supabase
        .from('livestream_events')
        .update({ 
          status: 'ended',
          updated_at: new Date().toISOString()
        })
        .in('id', staleIds);

      if (updateError) {
        console.error('[CLEANUP-STALE-STREAMS] Error updating stale events:', updateError);
        throw updateError;
      }

      console.log(`[CLEANUP-STALE-STREAMS] Successfully ended ${staleEvents.length} stale events:`, 
        staleEvents.map(e => ({ id: e.id, title: e.title, last_heartbeat: e.last_heartbeat }))
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        cleanedUp: staleEvents.length,
        events: staleEvents 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[CLEANUP-STALE-STREAMS] Function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
