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
      email,
      first_name,
      last_name,
      phone,
      source,
      tenant_slug
    } = await req.json();

    if (!jrny_id || !email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing jrny_id or email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[JRNY-REVEAL] Request:', { jrny_id, email, source });

    // Check if this email already exists in jrny_visitors
    const { data: existingByEmail } = await supabase
      .from('jrny_visitors')
      .select('jrny_id, engagement_score, heat_level, portals_visited, total_page_views, total_sessions')
      .eq('email', email)
      .single();

    // Get current visitor
    const { data: currentVisitor } = await supabase
      .from('jrny_visitors')
      .select('*')
      .eq('jrny_id', jrny_id)
      .single();

    if (!currentVisitor) {
      return new Response(
        JSON.stringify({ success: false, error: 'Visitor not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let finalJrnyId = jrny_id;
    let wasMerged = false;

    // If email already exists, merge the profiles
    if (existingByEmail && existingByEmail.jrny_id !== jrny_id) {
      console.log('[JRNY-REVEAL] Merging profiles:', { from: jrny_id, to: existingByEmail.jrny_id });
      
      const existingScore = (existingByEmail.engagement_score as number) || 0;
      const currentScore = (currentVisitor.engagement_score as number) || 0;
      const existingPageViews = (existingByEmail.total_page_views as number) || 0;
      const currentPageViews = (currentVisitor.total_page_views as number) || 0;
      const existingSessions = (existingByEmail.total_sessions as number) || 0;
      const currentSessions = (currentVisitor.total_sessions as number) || 0;
      
      const mergedScore = existingScore + currentScore;
      const existingPortals = (existingByEmail.portals_visited as string[]) || [];
      const currentPortals = (currentVisitor.portals_visited as string[]) || [];
      const mergedPortals = [...new Set([...existingPortals, ...currentPortals])];

      // Update the existing profile with merged data
      await supabase
        .from('jrny_visitors')
        .update({
          engagement_score: mergedScore,
          portals_visited: mergedPortals,
          total_page_views: existingPageViews + currentPageViews,
          total_sessions: existingSessions + currentSessions,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('jrny_id', existingByEmail.jrny_id);

      // Move events to the existing profile
      await supabase
        .from('jrny_events')
        .update({ jrny_id: existingByEmail.jrny_id })
        .eq('jrny_id', jrny_id);

      // Move portal visits
      await supabase
        .from('jrny_portal_visits')
        .update({ jrny_id: existingByEmail.jrny_id })
        .eq('jrny_id', jrny_id);

      // Update fingerprint mappings
      await supabase
        .from('jrny_fingerprint_map')
        .update({ jrny_id: existingByEmail.jrny_id })
        .eq('jrny_id', jrny_id);

      // Delete the duplicate visitor
      await supabase
        .from('jrny_visitors')
        .delete()
        .eq('jrny_id', jrny_id);

      finalJrnyId = existingByEmail.jrny_id;
      wasMerged = true;
    } else {
      // Update current visitor with email
      await supabase
        .from('jrny_visitors')
        .update({
          email,
          identity_revealed_at: currentVisitor.identity_revealed_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('jrny_id', jrny_id);
    }

    // Track the reveal event
    await supabase.from('jrny_events').insert({
      jrny_id: finalJrnyId,
      event_type: 'email_signup',
      event_data: { source, first_name, last_name, phone },
    });

    // Check if there's an existing user with this email
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Link visitor to existing user
      await supabase
        .from('jrny_visitors')
        .update({ converted_user_id: existingUser.user_id })
        .eq('jrny_id', finalJrnyId);

      await supabase
        .from('user_profiles')
        .update({ jrny_member_id: finalJrnyId })
        .eq('user_id', existingUser.user_id);
    }

    // Recalculate engagement score
    await supabase.rpc('calculate_jrny_engagement', { p_jrny_id: finalJrnyId });

    // Get updated visitor
    const { data: updatedVisitor } = await supabase
      .from('jrny_visitors')
      .select('engagement_score, heat_level, portals_visited')
      .eq('jrny_id', finalJrnyId)
      .single();

    console.log('[JRNY-REVEAL] Success:', { finalJrnyId, wasMerged, linkedUser: !!existingUser });

    return new Response(
      JSON.stringify({
        success: true,
        jrny_id: finalJrnyId,
        was_merged: wasMerged,
        linked_to_user: !!existingUser,
        engagement_score: updatedVisitor?.engagement_score,
        heat_level: updatedVisitor?.heat_level,
        portals_visited: updatedVisitor?.portals_visited,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[JRNY-REVEAL] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
