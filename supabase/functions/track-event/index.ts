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
    const { eventType, eventData, pageUrl, sessionId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const { data: { user } } = await supabaseClient.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      userId = user?.id || null;
    }

    // Insert event
    const { data, error } = await supabaseClient
      .from('user_events')
      .insert({
        user_id: userId,
        session_id: sessionId,
        event_type: eventType,
        event_data: eventData,
        page_url: pageUrl,
        user_agent: req.headers.get('user-agent'),
      })
      .select()
      .single();

    if (error) throw error;

    // Update analytics if user is logged in
    if (userId) {
      // Try to upsert analytics data
      await supabaseClient
        .from('user_analytics')
        .upsert({
          user_id: userId,
          total_visits: 1,
          last_activity: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });
    }

    return new Response(
      JSON.stringify({ success: true, event: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error tracking event:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
