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
    const { enrollmentId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("automation_enrollments")
      .select(`
        *,
        automation_sequences (
          steps,
          name
        )
      `)
      .eq("id", enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      throw new Error("Enrollment not found");
    }

    const steps = enrollment.automation_sequences.steps;
    const currentStepIndex = enrollment.current_step_index || 0;
    const currentStep = steps[currentStepIndex];

    if (!currentStep) {
      // Automation complete
      await supabase
        .from("automation_enrollments")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", enrollmentId);

      return new Response(
        JSON.stringify({ success: true, message: "Automation completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Execute step based on type
    let stepResult = { success: true, shouldContinue: true, nextStepIndex: currentStepIndex + 1 };

    switch (currentStep.type) {
      case "email":
        stepResult = await processEmailStep(supabase, enrollment, currentStep);
        break;
      case "sms":
        stepResult = await processSMSStep(supabase, enrollment, currentStep);
        break;
      case "wait":
        stepResult = await processWaitStep(supabase, enrollment, currentStep);
        break;
      case "condition":
        stepResult = await processConditionStep(supabase, enrollment, currentStep);
        break;
      default:
        console.log(`Unknown step type: ${currentStep.type}`);
    }

    // Update enrollment status
    if (stepResult.shouldContinue) {
      await supabase
        .from("automation_enrollments")
        .update({ current_step_index: stepResult.nextStepIndex })
        .eq("id", enrollmentId);
    }

    // Log step execution
    await supabase.from("automation_step_executions").insert({
      enrollment_id: enrollmentId,
      step_index: currentStepIndex,
      step_type: currentStep.type,
      status: stepResult.success ? "completed" : "failed",
      executed_at: new Date().toISOString(),
      result: stepResult,
    });

    return new Response(
      JSON.stringify({ success: true, stepResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in process-cross-channel-automation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

async function processEmailStep(supabase: any, enrollment: any, step: any) {
  console.log("Processing email step:", step);

  // Get user email
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", enrollment.user_id)
    .single();

  const { data: user } = await supabase.auth.admin.getUserById(enrollment.user_id);

  if (!user?.user?.email) {
    return { success: false, shouldContinue: false, nextStepIndex: enrollment.current_step_index + 1, error: "No email found" };
  }

  // Call send email function
  const { error } = await supabase.functions.invoke("send-email-campaign", {
    body: {
      to: user.user.email,
      subject: step.subject,
      body: step.body.replace("{first_name}", profile?.display_name || "there"),
      userId: enrollment.user_id,
    },
  });

  if (error) {
    console.error("Error sending email:", error);
    return { success: false, shouldContinue: true, nextStepIndex: enrollment.current_step_index + 1 };
  }

  return { success: true, shouldContinue: true, nextStepIndex: enrollment.current_step_index + 1 };
}

async function processSMSStep(supabase: any, enrollment: any, step: any) {
  console.log("Processing SMS step:", step);

  // Get user phone number
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("phone_number, sms_opt_in, display_name")
    .eq("user_id", enrollment.user_id)
    .single();

  if (!profile?.phone_number || !profile?.sms_opt_in) {
    console.log("User not opted in for SMS or no phone number");
    return { success: false, shouldContinue: true, nextStepIndex: enrollment.current_step_index + 1 };
  }

  // Call send SMS function
  const { error } = await supabase.functions.invoke("send-sms", {
    body: {
      phoneNumber: profile.phone_number,
      messageBody: step.body.replace("{first_name}", profile?.display_name || "there"),
      userId: enrollment.user_id,
    },
  });

  if (error) {
    console.error("Error sending SMS:", error);
    return { success: false, shouldContinue: true, nextStepIndex: enrollment.current_step_index + 1 };
  }

  return { success: true, shouldContinue: true, nextStepIndex: enrollment.current_step_index + 1 };
}

async function processWaitStep(supabase: any, enrollment: any, step: any) {
  console.log("Processing wait step:", step);

  const delayHours = step.delay_hours || 0;
  const delayDays = step.delay_days || 0;
  const totalHours = delayHours + (delayDays * 24);

  // Schedule next step execution
  const scheduledFor = new Date(Date.now() + totalHours * 60 * 60 * 1000);

  await supabase
    .from("automation_step_executions")
    .insert({
      enrollment_id: enrollment.id,
      step_index: enrollment.current_step_index,
      step_type: "wait",
      scheduled_for: scheduledFor.toISOString(),
      status: "scheduled",
    });

  return { success: true, shouldContinue: false, nextStepIndex: enrollment.current_step_index + 1 };
}

async function processConditionStep(supabase: any, enrollment: any, step: any) {
  console.log("Processing condition step:", step);

  let conditionMet = false;

  switch (step.condition_type) {
    case "email_opened":
      const { data: emailOpens } = await supabase
        .from("email_sends")
        .select("opened_at")
        .eq("user_id", enrollment.user_id)
        .not("opened_at", "is", null)
        .order("created_at", { ascending: false })
        .limit(1);
      conditionMet = emailOpens && emailOpens.length > 0;
      break;

    case "email_clicked":
      const { data: emailClicks } = await supabase
        .from("email_sends")
        .select("clicked_at")
        .eq("user_id", enrollment.user_id)
        .not("clicked_at", "is", null)
        .order("created_at", { ascending: false })
        .limit(1);
      conditionMet = emailClicks && emailClicks.length > 0;
      break;

    case "email_not_opened":
      const { data: recentEmail } = await supabase
        .from("email_sends")
        .select("opened_at")
        .eq("user_id", enrollment.user_id)
        .order("created_at", { ascending: false })
        .limit(1);
      conditionMet = recentEmail && recentEmail.length > 0 && !recentEmail[0].opened_at;
      break;

    case "ptp_score":
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("ptp")
        .eq("user_id", enrollment.user_id)
        .single();
      conditionMet = profile && (profile.ptp || 0) >= (step.condition_value || 67);
      break;

    case "purchased":
      const { data: purchases } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", enrollment.user_id)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);
      conditionMet = purchases && purchases.length > 0;
      break;

    default:
      console.log("Unknown condition type:", step.condition_type);
  }

  // Determine next step based on condition
  const nextStepIndex = conditionMet 
    ? enrollment.current_step_index + 1  // Continue to next step if condition met
    : step.else_step_index || enrollment.current_step_index + 2; // Skip to alternative branch

  return { success: true, shouldContinue: true, nextStepIndex, conditionMet };
}
