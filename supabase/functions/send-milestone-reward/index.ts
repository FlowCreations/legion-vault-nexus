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

    const { user_id, shipping_address } = await req.json();

    console.log('Processing Dunbar Champion reward for user:', user_id);

    // Verify user has achieved Dunbar Champion milestone
    const { data: milestone, error: milestoneError } = await supabase
      .from('user_milestones')
      .select('*')
      .eq('user_id', user_id)
      .eq('milestone_type', 'dunbar_champion')
      .single();

    if (milestoneError || !milestone) {
      throw new Error('Dunbar Champion milestone not found');
    }

    if (milestone.reward_claimed) {
      throw new Error('Reward already claimed');
    }

    // Update milestone with shipping address and reward claimed status
    const { error: updateError } = await supabase
      .from('user_milestones')
      .update({
        reward_claimed: true,
        reward_claimed_at: new Date().toISOString(),
        shipping_address,
      })
      .eq('id', milestone.id);

    if (updateError) {
      throw updateError;
    }

    // Track reward claim event
    await supabase.from('user_events').insert({
      user_id,
      event_type: 'reward_claimed',
      event_data: {
        milestone_type: 'dunbar_champion',
        reward_code: 'JRNY7HOUR',
      },
    });

    // TODO: Integrate with fulfillment API (e.g., Shopify, gift card service)
    // For now, log the shipping info
    console.log('Shipping address saved:', shipping_address);

    // TODO: Send confirmation email
    console.log('Reward claim completed for user:', user_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Reward claimed successfully',
        reward_code: 'JRNY7HOUR'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing reward claim:', error);
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
