import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, triggerType, metadata } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find active automations matching trigger type
    const { data: automations } = await supabase
      .from("automation_sequences")
      .select("*")
      .eq("trigger_type", triggerType)
      .eq("is_active", true);

    if (!automations || automations.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active automations found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile for filtering
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Check each automation's trigger rules
    for (const automation of automations) {
      const rules = automation.trigger_rules;
      let shouldTrigger = true;

      // Example: PTP threshold check
      if (triggerType === "ptp_threshold" && rules.min_ptp) {
        shouldTrigger = (profile?.ptp_current || 0) >= rules.min_ptp;
      }

      if (shouldTrigger) {
        // Queue automation steps (simplified - Phase 4 will have step scheduler)
        console.log(`Triggering automation ${automation.id} for user ${userId}`);
        
        // For now, just log - Phase 4 will implement actual step execution
        // This would schedule emails based on automation.steps array
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error triggering automation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
