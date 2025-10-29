import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { sessionId, userId, step, eventType, variant, meta = {} } = await req.json();

    // Update funnel session
    await supabase
      .from("funnel_sessions")
      .update({
        current_step: step,
        completed_steps: supabase.rpc('array_append', { 
          arr: 'completed_steps', 
          elem: step 
        }),
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId);

    // Track conversion if applicable
    if (eventType === 'conversion') {
      const { amount, productId, conversionType } = meta;
      
      await supabase.from("funnel_conversions").insert({
        session_id: sessionId,
        user_id: userId,
        step_number: step,
        variant_name: variant,
        conversion_type: conversionType,
        product_id: productId,
        amount: amount,
        meta,
      });

      // Update session revenue
      await supabase
        .from("funnel_sessions")
        .update({
          total_revenue: supabase.rpc('increment_revenue', { 
            session_id: sessionId, 
            amount 
          }),
          conversion_step: step,
        })
        .eq("session_id", sessionId);

      // Update AB test results
      await supabase.rpc('increment_ab_conversions', {
        p_step: step,
        p_variant: variant,
        p_revenue: amount,
      });
    }

    // Update AB test views
    await supabase.rpc('increment_ab_views', {
      p_step: step,
      p_variant: variant,
    });

    // Track Meta Pixel events
    const pixelEvents: Record<string, string> = {
      'lead': 'Lead',
      'checkout': 'InitiateCheckout',
      'purchase': 'Purchase',
      'portal_join': 'CompleteRegistration',
    };

    return new Response(
      JSON.stringify({ 
        success: true,
        pixelEvent: pixelEvents[eventType] || null 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error tracking funnel event:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
