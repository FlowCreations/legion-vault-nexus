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

    const { sessionId, step } = await req.json();

    // Get existing session
    const { data: session } = await supabase
      .from("funnel_sessions")
      .select("variant_assignments")
      .eq("session_id", sessionId)
      .single();

    const assignments = session?.variant_assignments || {};
    const stepKey = `step_${step}`;

    // Check if variant already assigned
    if (assignments[stepKey]) {
      const { data: pageData } = await supabase
        .from("funnel_pages")
        .select("*")
        .eq("step_number", step)
        .eq("variant_name", assignments[stepKey])
        .eq("is_active", true)
        .single();

      return new Response(
        JSON.stringify({ 
          variant: assignments[stepKey],
          pageData 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assign new variant (33/33/34% split)
    const rand = Math.random() * 100;
    const variant = rand < 33 ? 'A' : rand < 66 ? 'B' : 'C';

    // Update session with new assignment
    assignments[stepKey] = variant;
    await supabase
      .from("funnel_sessions")
      .update({ variant_assignments: assignments })
      .eq("session_id", sessionId);

    // Get page data for assigned variant
    const { data: pageData } = await supabase
      .from("funnel_pages")
      .select("*")
      .eq("step_number", step)
      .eq("variant_name", variant)
      .eq("is_active", true)
      .single();

    return new Response(
      JSON.stringify({ variant, pageData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error assigning variant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
