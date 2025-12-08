import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Scoring weights for different event types
const EVENT_SCORES: Record<string, number> = {
  page_view: 1,
  music_play: 3,
  video_watch: 2,
  merch_view: 5,
  add_to_cart: 15,
  purchase: 50,
  email_signup: 25,
  return_visit: 5,
  download: 10,
  share: 8,
  comment: 5,
  livestream_join: 10,
  livestream_reaction: 2,
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
      session_id,
      event_type,
      event_data,
      page_url,
      tenant_slug
    } = await req.json();

    if (!jrny_id || !event_type) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing jrny_id or event_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[JRNY-TRACK] Event:', { jrny_id, event_type, tenant_slug });

    // Get tenant ID
    let tenantId = null;
    if (tenant_slug) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenant_slug)
        .single();
      tenantId = tenant?.id;
    }

    // Ensure visitor exists before inserting event (handles orphaned jrny_ids)
    const { data: existingVisitor } = await supabase
      .from('jrny_visitors')
      .select('jrny_id')
      .eq('jrny_id', jrny_id)
      .single();

    if (!existingVisitor) {
      console.log('[JRNY-TRACK] Visitor not found, creating:', jrny_id);
      const { error: visitorError } = await supabase
        .from('jrny_visitors')
        .insert({
          jrny_id,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          total_page_views: 0,
          engagement_score: 0,
          heat_level: 'cold',
        });
      
      if (visitorError) {
        console.error('[JRNY-TRACK] Visitor create error:', visitorError);
        // Continue anyway - don't block event tracking
      }
    }

    // Insert event
    const { error: eventError } = await supabase
      .from('jrny_events')
      .insert({
        jrny_id,
        session_id,
        event_type,
        event_data: event_data || {},
        page_url,
        tenant_id: tenantId,
      });

    if (eventError) {
      console.error('[JRNY-TRACK] Event insert error:', eventError);
      // Don't throw - return graceful error to not break client
      return new Response(
        JSON.stringify({ success: false, error: 'Event tracking failed', details: eventError.message }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update visitor stats based on event type
    const scoreIncrement = EVENT_SCORES[event_type] || 1;
    
    const { data: visitor } = await supabase
      .from('jrny_visitors')
      .select('engagement_score, total_page_views')
      .eq('jrny_id', jrny_id)
      .single();

    if (visitor) {
      const currentScore = (visitor.engagement_score as number) || 0;
      const newScore = currentScore + scoreIncrement;
      
      // Calculate heat level
      let heatLevel = 'cold';
      if (newScore >= 150) heatLevel = 'superfan';
      else if (newScore >= 51) heatLevel = 'hot';
      else if (newScore >= 11) heatLevel = 'warm';

      await supabase
        .from('jrny_visitors')
        .update({
          engagement_score: newScore,
          heat_level: heatLevel,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('jrny_id', jrny_id);

      console.log('[JRNY-TRACK] Updated score:', { jrny_id, newScore, heatLevel });
    }

    // Update portal visit stats if session exists
    if (session_id && tenantId) {
      const { data: currentVisit } = await supabase
        .from('jrny_portal_visits')
        .select('music_plays, video_watches, merch_views')
        .eq('jrny_id', jrny_id)
        .eq('session_id', session_id)
        .single();

      if (currentVisit) {
        const updates: Record<string, unknown> = {};
        if (event_type === 'music_play') updates.music_plays = ((currentVisit.music_plays as number) || 0) + 1;
        if (event_type === 'video_watch') updates.video_watches = ((currentVisit.video_watches as number) || 0) + 1;
        if (event_type === 'merch_view') updates.merch_views = ((currentVisit.merch_views as number) || 0) + 1;
        if (event_type === 'add_to_cart') updates.add_to_cart = true;
        if (event_type === 'purchase') updates.purchase_made = true;

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('jrny_portal_visits')
            .update(updates)
            .eq('jrny_id', jrny_id)
            .eq('session_id', session_id);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, score_added: scoreIncrement }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[JRNY-TRACK] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
