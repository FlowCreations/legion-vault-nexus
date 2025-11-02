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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, milestone_type, total_minutes } = await req.json();

    console.log('Checking milestone achievement:', { user_id, milestone_type, total_minutes });

    // Verify milestone exists
    const { data: milestone, error: milestoneError } = await supabase
      .from('user_milestones')
      .select('*')
      .eq('user_id', user_id)
      .eq('milestone_type', milestone_type)
      .single();

    if (milestoneError) {
      throw new Error(`Milestone not found: ${milestoneError.message}`);
    }

    // Track achievement event
    await supabase.from('user_events').insert({
      user_id,
      event_type: `milestone_${milestone_type}_achieved`,
      event_data: {
        total_minutes,
        milestone_type,
        achieved_at: milestone.achieved_at,
      },
    });

    console.log('Milestone achievement tracked successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Milestone achievement processed',
        milestone 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing milestone achievement:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
