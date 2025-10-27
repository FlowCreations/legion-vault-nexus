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
    const { automationId, userId, metadata } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('automation_enrollments')
      .select('id')
      .eq('automation_id', automationId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ message: 'Already enrolled' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create enrollment
    const { data: enrollment } = await supabase
      .from('automation_enrollments')
      .insert({
        automation_id: automationId,
        user_id: userId,
        metadata: metadata || {}
      })
      .select()
      .single();

    // Schedule first step
    const { data: automation } = await supabase
      .from('automation_sequences')
      .select('steps')
      .eq('id', automationId)
      .single();

    if (automation && automation.steps) {
      const firstStep = (automation.steps as any[])[0];
      await supabase.from('automation_step_executions').insert({
        enrollment_id: enrollment.id,
        step_index: 0,
        step_type: firstStep.type,
        scheduled_for: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ success: true, enrollmentId: enrollment.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error enrolling in automation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
