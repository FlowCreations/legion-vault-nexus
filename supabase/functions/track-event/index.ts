import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed event types for validation
const ALLOWED_EVENT_TYPES = [
  'page_view',
  'music_play',
  'music_listen',
  'music_pause',
  'album_view',
  'purchase_started',
  'purchase_completed',
  'video_view',
  'video_watch',
  'merch_view',
  'show_view',
  'chat_interaction',
  'subscribe',
  'add_to_cart',
  'login',
  'session_start',
  'session_end',
  'favorites_add',
  'email_open',
  'email_click',
  'comment_post',
  'like',
  'reaction',
  'share',
  'rsvp_livestream',
  'attend_livestream',
  'cart_abandon',
  'checkout_view',
  'product_hover',
  'download_track',
  'watch_countdown',
  'profile_complete',
  'mobile_visit',
  'desktop_visit',
  'merch_detail_view',
  'ticket_click',
  'bio_view',
  'poll_participate'
];

const MAX_EVENT_DATA_SIZE = 10000; // 10KB max for event data
const MAX_URL_LENGTH = 2048;
const MAX_JSON_DEPTH = 5;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper to validate JSON depth
function getJsonDepth(obj: any, depth = 0): number {
  if (depth > MAX_JSON_DEPTH || typeof obj !== 'object' || obj === null) {
    return depth;
  }
  return Math.max(...Object.values(obj).map(v => getJsonDepth(v, depth + 1)));
}

// Helper to validate URL format
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Helper to sanitize user agent
function sanitizeUserAgent(ua: string | null): string | null {
  if (!ua) return null;
  // Limit length and remove potential injection characters
  return ua.slice(0, 500).replace(/[<>'"]/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventType, eventData, pageUrl, sessionId } = await req.json();

    // Input validation
    if (!eventType || typeof eventType !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid event type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_EVENT_TYPES.includes(eventType)) {
      return new Response(
        JSON.stringify({ error: `Event type must be one of: ${ALLOWED_EVENT_TYPES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced validation for eventData
    if (eventData) {
      const eventDataStr = JSON.stringify(eventData);
      if (eventDataStr.length > MAX_EVENT_DATA_SIZE) {
        return new Response(
          JSON.stringify({ error: 'Event data too large' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check JSON depth to prevent deeply nested objects
      if (getJsonDepth(eventData) > MAX_JSON_DEPTH) {
        return new Response(
          JSON.stringify({ error: 'Event data structure too complex' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Enhanced URL validation
    if (pageUrl) {
      if (pageUrl.length > MAX_URL_LENGTH) {
        return new Response(
          JSON.stringify({ error: 'Page URL too long' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!isValidUrl(pageUrl)) {
        return new Response(
          JSON.stringify({ error: 'Invalid page URL format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Enhanced session ID validation - enforce UUID format
    if (!sessionId || typeof sessionId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!UUID_REGEX.test(sessionId)) {
      return new Response(
        JSON.stringify({ error: 'Session ID must be a valid UUID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      try {
        const { data: { user }, error } = await supabaseClient.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        if (!error && user) {
          userId = user.id;
        }
      } catch (e) {
        console.error('Auth error:', e);
        // Continue with null userId for anonymous tracking
      }
    }

    // Insert event with sanitized data
    const { data, error } = await supabaseClient
      .from('user_events')
      .insert({
        user_id: userId,
        session_id: sessionId,
        event_type: eventType,
        event_data: eventData,
        page_url: pageUrl,
        user_agent: sanitizeUserAgent(req.headers.get('user-agent')),
      })
      .select()
      .single();

    if (error) throw error;

    // Update user_profiles with real-time analytics if user is logged in
    if (userId) {
      // Calculate duration for watch/listen events
      const duration = eventData?.duration || 0;
      
      // Update user_profiles based on event type using database functions
      if (eventType === 'video_watch' || eventType === 'video_view') {
        try {
          await supabaseClient.rpc('increment_watch_time', {
            p_user_id: userId,
            p_duration: duration
          });
        } catch (err) {
          console.error('Error incrementing watch time:', err);
        }
      } else if (eventType === 'music_listen' || eventType === 'music_play') {
        try {
          await supabaseClient.rpc('increment_listen_time', {
            p_user_id: userId,
            p_duration: duration
          });
        } catch (err) {
          console.error('Error incrementing listen time:', err);
        }
      } else {
        // For other events, just update last_login
        await supabaseClient
          .from('user_profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('user_id', userId);
      }

      // Update user_analytics table
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
