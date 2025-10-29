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

    // Get current session to update it properly
    const { data: currentSession } = await supabase
      .from("funnel_sessions")
      .select("completed_steps, total_revenue")
      .eq("session_id", sessionId)
      .maybeSingle();

    // Update completed steps array
    const completedSteps = currentSession?.completed_steps || [];
    if (!completedSteps.includes(step)) {
      completedSteps.push(step);
    }

    // Update funnel session
    await supabase
      .from("funnel_sessions")
      .update({
        current_step: step,
        completed_steps: completedSteps,
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
      const newRevenue = (currentSession?.total_revenue || 0) + (amount || 0);
      await supabase
        .from("funnel_sessions")
        .update({
          total_revenue: newRevenue,
          conversion_step: step,
        })
        .eq("session_id", sessionId);

      // Update AB test conversions
      const { data: abResult } = await supabase
        .from("ab_test_results")
        .select("conversions, total_revenue")
        .eq("step_number", step)
        .eq("variant_name", variant)
        .maybeSingle();

      if (abResult) {
        await supabase
          .from("ab_test_results")
          .update({
            conversions: (abResult.conversions || 0) + 1,
            total_revenue: (abResult.total_revenue || 0) + (amount || 0),
            last_updated: new Date().toISOString(),
          })
          .eq("step_number", step)
          .eq("variant_name", variant);
      }
    }

    // Update AB test views
    const { data: abViews } = await supabase
      .from("ab_test_results")
      .select("views")
      .eq("step_number", step)
      .eq("variant_name", variant)
      .maybeSingle();

    if (abViews) {
      await supabase
        .from("ab_test_results")
        .update({
          views: (abViews.views || 0) + 1,
          last_updated: new Date().toISOString(),
        })
        .eq("step_number", step)
        .eq("variant_name", variant);
    }

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
