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

    const { eventId } = await req.json();

    if (!eventId) {
      throw new Error('Event ID is required');
    }

    console.log('[VOD] Creating VOD for event:', eventId);

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('livestream_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found');
    }

    // Calculate stream duration
    const startTime = new Date(event.started_at || event.scheduled_start);
    const endTime = event.ended_at ? new Date(event.ended_at) : new Date();
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Create VOD record
    const { data: vod, error: vodError } = await supabase
      .from('livestream_vods')
      .insert({
        event_id: eventId,
        title: event.title,
        description: event.description,
        stream_started_at: startTime.toISOString(),
        stream_ended_at: endTime.toISOString(),
        duration_seconds: durationSeconds,
        processing_status: 'pending'
      })
      .select()
      .single();

    if (vodError) {
      console.error('[VOD] Error creating VOD:', vodError);
      throw vodError;
    }

    console.log('[VOD] VOD created successfully:', vod.id);

    // Trigger AI thumbnail generation
    try {
      const thumbnailResponse = await fetch(`${supabaseUrl}/functions/v1/generate-vod-thumbnail`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vodId: vod.id,
          title: event.title,
          description: event.description
        })
      });

      if (!thumbnailResponse.ok) {
        console.error('[VOD] Thumbnail generation failed:', await thumbnailResponse.text());
      } else {
        console.log('[VOD] Thumbnail generation triggered');
      }
    } catch (thumbnailError) {
      console.error('[VOD] Error triggering thumbnail generation:', thumbnailError);
    }

    // In a real implementation, you would:
    // 1. Trigger video processing (e.g., download LiveKit recording)
    // 2. Upload to storage bucket
    // 3. Update VOD with video_url

    // For now, mark as completed (in production, this would be done by a separate processing job)
    await supabase
      .from('livestream_vods')
      .update({ processing_status: 'completed' })
      .eq('id', vod.id);

    return new Response(
      JSON.stringify({ success: true, vod }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[VOD] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
