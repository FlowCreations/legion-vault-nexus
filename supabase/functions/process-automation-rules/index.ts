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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active automation rules
    const { data: rules, error: rulesError } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (rulesError) throw rulesError;

    let executionsCreated = 0;

    for (const rule of rules || []) {
      // Get eligible users based on trigger conditions
      let query = supabase
        .from("user_profiles")
        .select("user_id, ptp_score, era_label, total_spend, watch_time, listen_time, last_active_at, display_name");

      const conditions = rule.trigger_conditions || {};

      // Apply trigger conditions
      if (rule.trigger_type === "ptp_score" && conditions.ptp_min) {
        query = query.gte("ptp_score", conditions.ptp_min);
      }
      if (conditions.ptp_max) {
        query = query.lte("ptp_score", conditions.ptp_max);
      }
      if (rule.trigger_type === "era_label" && conditions.era_labels) {
        query = query.in("era_label", conditions.era_labels);
      }

      const { data: eligibleUsers, error: usersError } = await query;
      if (usersError) throw usersError;

      for (const user of eligibleUsers || []) {
        // Check if user already received this rule within cooldown period
        const cooldownTime = new Date(Date.now() - (rule.cooldown_hours || 24) * 60 * 60 * 1000);
        
        const { data: recentExecution } = await supabase
          .from("automation_rule_executions")
          .select("id")
          .eq("rule_id", rule.id)
          .eq("user_id", user.user_id)
          .gte("executed_at", cooldownTime.toISOString())
          .single();

        if (recentExecution) continue; // Skip if within cooldown

        // Check max sends per user
        const { count: executionCount } = await supabase
          .from("automation_rule_executions")
          .select("id", { count: "exact", head: true })
          .eq("rule_id", rule.id)
          .eq("user_id", user.user_id);

        if (executionCount && executionCount >= (rule.max_sends_per_user || 1)) {
          continue; // Skip if max sends reached
        }

        // Execute action based on action_type
        if (rule.action_type === "send_email") {
          const actionConfig = rule.action_config || {};
          
          // Get user email
          const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id);
          if (!authUser.user?.email) continue;

          // Send email via Resend
          const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
          if (!RESEND_API_KEY) continue;

          const emailBody = (actionConfig.email_body || "")
            .replace(/\{\{user_name\}\}/g, user.display_name || "there")
            .replace(/\{\{ptp_score\}\}/g, user.ptp_score?.toString() || "0")
            .replace(/\{\{era_label\}\}/g, user.era_label || "New Fan");

          const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Sons of Legion <noreply@sonsoflegion.com>",
              to: [authUser.user.email],
              subject: actionConfig.subject || "Special Message from Sons of Legion",
              html: emailBody,
            }),
          });

          if (resendResponse.ok) {
            // Log execution
            await supabase.from("automation_rule_executions").insert({
              rule_id: rule.id,
              user_id: user.user_id,
              status: "sent",
              metadata: {
                ptp_score: user.ptp_score,
                era_label: user.era_label,
                email: authUser.user.email,
              },
            });
            executionsCreated++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        executed: executionsCreated,
        message: `Processed ${rules?.length || 0} rules, created ${executionsCreated} executions` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing automation rules:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});