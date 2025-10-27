import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Renders email content with personalization variables
function renderEmailContent(content: string, profile: any): string {
  if (!content || !profile) return content;
  
  let rendered = content;
  
  // User variables
  rendered = rendered.replace(/\{\{user_name\}\}/g, profile.display_name || 'there');
  rendered = rendered.replace(/\{\{user_email\}\}/g, profile.user_id || '');
  
  // Scoring variables
  rendered = rendered.replace(/\{\{ptp_score\}\}/g, profile.ptp_current?.toString() || '0');
  rendered = rendered.replace(/\{\{era_label\}\}/g, profile.era_current || 'fan');
  
  return rendered;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find all pending step executions that are due
    const { data: pendingSteps } = await supabase
      .from('automation_step_executions')
      .select(`
        *,
        enrollment:automation_enrollments(
          *,
          automation:automation_sequences(*)
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(100);

    let processed = 0;

    for (const step of pendingSteps || []) {
      try {
        await executeStep(step, supabase);
        processed++;
      } catch (error: any) {
        console.error(`Failed to execute step ${step.id}:`, error);
        await supabase
          .from('automation_step_executions')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', step.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing automation queue:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

async function executeStep(step: any, supabase: any) {
  const automation = step.enrollment.automation;
  const steps = automation.steps as any[];
  const currentStep = steps[step.step_index];

  // Mark as executing
  await supabase
    .from('automation_step_executions')
    .update({ status: 'executing' })
    .eq('id', step.id);

  switch (currentStep.type) {
    case 'email':
      await sendAutomationEmail(step, currentStep, supabase);
      break;
    case 'delay':
      // Delay is handled by scheduling, just mark complete
      break;
    case 'condition':
      await evaluateCondition(step, currentStep, supabase);
      break;
    case 'action':
      await performAction(step, currentStep, supabase);
      break;
  }

  // Mark as completed
  await supabase
    .from('automation_step_executions')
    .update({
      status: 'completed',
      executed_at: new Date().toISOString()
    })
    .eq('id', step.id);

  // Schedule next step
  await scheduleNextStep(step, supabase);
}

async function sendAutomationEmail(step: any, stepConfig: any, supabase: any) {
  const enrollment = step.enrollment;
  
  // Get user profile for personalization
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', enrollment.user_id)
    .single();

  if (!profile) return;

  // Render email with personalization
  const renderedBody = renderEmailContent(stepConfig.body, profile);
  const renderedSubject = renderEmailContent(stepConfig.subject, profile);

  // Send via Resend (would need RESEND_API_KEY)
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (resendKey) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'JRNY <onboarding@resend.dev>',
        to: [profile.user_id],
        subject: renderedSubject,
        html: renderedBody,
      }),
    });
  }

  // Track send
  await supabase.from('email_sends').insert({
    campaign_id: enrollment.automation_id,
    user_id: enrollment.user_id,
    email_address: profile.user_id,
  });
}

async function evaluateCondition(step: any, stepConfig: any, supabase: any) {
  // Placeholder for condition evaluation
  console.log('Evaluating condition:', stepConfig);
}

async function performAction(step: any, stepConfig: any, supabase: any) {
  // Placeholder for action execution
  console.log('Performing action:', stepConfig);
}

async function scheduleNextStep(currentStep: any, supabase: any) {
  const enrollment = currentStep.enrollment;
  const automation = enrollment.automation;
  const steps = automation.steps as any[];
  const nextStepIndex = currentStep.step_index + 1;

  if (nextStepIndex >= steps.length) {
    // Automation complete
    await supabase
      .from('automation_enrollments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', enrollment.id);
    return;
  }

  const nextStep = steps[nextStepIndex];
  let scheduledFor = new Date();

  if (nextStep.type === 'delay') {
    const delay = nextStep;
    if (delay.delayUnit === 'minutes') {
      scheduledFor.setMinutes(scheduledFor.getMinutes() + delay.delayValue);
    } else if (delay.delayUnit === 'hours') {
      scheduledFor.setHours(scheduledFor.getHours() + delay.delayValue);
    } else if (delay.delayUnit === 'days') {
      scheduledFor.setDate(scheduledFor.getDate() + delay.delayValue);
    }
  }

  // Create next step execution
  await supabase.from('automation_step_executions').insert({
    enrollment_id: enrollment.id,
    step_index: nextStepIndex,
    step_type: nextStep.type,
    scheduled_for: scheduledFor.toISOString(),
  });
}
