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

    console.log('Processing scheduled cameos...');

    // Find all scheduled cameos that should now be active
    const { data: scheduledCameos, error: fetchError } = await supabaseClient
      .from('cameos')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching scheduled cameos:', fetchError);
      throw fetchError;
    }

    if (!scheduledCameos || scheduledCameos.length === 0) {
      console.log('No scheduled cameos to process');
      return new Response(
        JSON.stringify({ message: 'No scheduled cameos to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${scheduledCameos.length} cameos to activate`);

    // Update cameos to active status
    const { error: updateError } = await supabaseClient
      .from('cameos')
      .update({ status: 'active' })
      .in('id', scheduledCameos.map(c => c.id));

    if (updateError) {
      console.error('Error updating cameos:', updateError);
      throw updateError;
    }

    // Create notification records for each activated cameo
    const notifications = scheduledCameos.map(cameo => ({
      cameo_id: cameo.id,
      recipient_user_id: cameo.recipient_user_id,
      notification_type: 'in_app',
      email_enabled: false, // Email disabled until RESEND_API_KEY is configured
    }));

    const { error: notifError } = await supabaseClient
      .from('cameo_notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Error creating notifications:', notifError);
      // Don't throw - notifications are non-critical
    }

    console.log(`Successfully activated ${scheduledCameos.length} cameos`);

    return new Response(
      JSON.stringify({ 
        message: 'Scheduled cameos processed successfully', 
        processed: scheduledCameos.length,
        cameos: scheduledCameos.map(c => ({ id: c.id, recipient: c.recipient_manual_name || 'User' }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-scheduled-cameos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
