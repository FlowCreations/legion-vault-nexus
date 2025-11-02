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

    // Find all live events older than 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    const { data: staleEvents, error: fetchError } = await supabase
      .from('livestream_events')
      .select('id, title, created_at')
      .eq('status', 'live')
      .lt('created_at', twoHoursAgo);

    if (fetchError) {
      console.error('[CLEANUP-STALE-STREAMS] Error fetching stale events:', fetchError);
      throw fetchError;
    }

    console.log(`[CLEANUP-STALE-STREAMS] Found ${staleEvents?.length || 0} stale events`);

    if (staleEvents && staleEvents.length > 0) {
      // Update all stale events to 'ended'
      const { error: updateError } = await supabase
        .from('livestream_events')
        .update({ 
          status: 'ended',
          updated_at: new Date().toISOString()
        })
        .eq('status', 'live')
        .lt('created_at', twoHoursAgo);

      if (updateError) {
        console.error('[CLEANUP-STALE-STREAMS] Error updating stale events:', updateError);
        throw updateError;
      }

      console.log(`[CLEANUP-STALE-STREAMS] Successfully ended ${staleEvents.length} stale events:`, 
        staleEvents.map(e => ({ id: e.id, title: e.title, created_at: e.created_at }))
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        cleanedUp: staleEvents?.length || 0,
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
