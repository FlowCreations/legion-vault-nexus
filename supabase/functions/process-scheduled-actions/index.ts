import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch pending actions
    const { data: pendingActions, error: fetchError } = await supabase
      .from("sequence_executions")
      .select("*")
      .eq("status", "active")
      .lte("next_action_scheduled_for", new Date().toISOString())
      .not("next_action_type", "is", null)
      .limit(100);

    if (fetchError) throw fetchError;

    console.log(`Processing ${pendingActions?.length || 0} scheduled actions`);

    const results = {
      processed: 0,
      email_sent: 0,
      sms_sent: 0,
      inbox_sent: 0,
      popup_queued: 0,
      errors: 0
    };

    for (const action of pendingActions || []) {
      try {
        // Verify user hasn't opted out or converted
        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("email_opt_in, sms_opt_in")
          .eq("user_id", action.user_id)
          .single();

        if (!userProfile) {
          console.log(`User ${action.user_id} not found, skipping`);
          continue;
        }

        const actionConfig = action.next_action_config;
        
        switch (action.next_action_type) {
          case "email":
            if (!userProfile.email_opt_in) {
              console.log(`User ${action.user_id} opted out of email`);
              break;
            }
            await sendEmail(supabase, action.user_id, actionConfig, action.sequence_id, action.goal_id);
            results.email_sent++;
            break;

          case "sms":
            if (!userProfile.sms_opt_in) {
              console.log(`User ${action.user_id} opted out of SMS`);
              break;
            }
            await sendSMS(supabase, action.user_id, actionConfig, action.sequence_id, action.goal_id);
            results.sms_sent++;
            break;

          case "inbox":
            await sendInboxMessage(supabase, action.user_id, actionConfig, action.id);
            results.inbox_sent++;
            break;

          case "popup":
            await queuePopup(supabase, action.user_id, actionConfig, action.id);
            results.popup_queued++;
            break;

          default:
            console.log(`Unknown action type: ${action.next_action_type}`);
        }

        // Track the interaction
        await supabase.functions.invoke("track-interaction-event", {
          body: {
            userId: action.user_id,
            channelType: action.next_action_type,
            interactionType: "sent",
            sequenceId: action.sequence_id,
            goalId: action.goal_id,
            metadata: actionConfig
          }
        });

        // Clear the scheduled action
        await supabase
          .from("sequence_executions")
          .update({
            next_action_scheduled_for: null,
            next_action_type: null,
            next_action_config: null
          })
          .eq("id", action.id);

        results.processed++;

      } catch (error) {
        console.error(`Error processing action ${action.id}:`, error);
        results.errors++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in process-scheduled-actions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendEmail(supabase: any, userId: string, config: any, sequenceId: string, goalId: string) {
  // Get user email
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("email, first_name, last_name")
    .eq("user_id", userId)
    .single();

  if (!profile?.email) {
    throw new Error("User email not found");
  }

  // Replace variables in subject and body
  const subject = replaceVariables(config.subject || "JRNY Update", profile);
  const body = replaceVariables(config.message || config.content || "", profile);

  // Send via existing send-email-campaign function
  await supabase.functions.invoke("send-email-campaign", {
    body: {
      to: profile.email,
      subject,
      body,
      userId,
      campaignId: goalId,
      variant: config.variant || "A"
    }
  });
}

async function sendSMS(supabase: any, userId: string, config: any, sequenceId: string, goalId: string) {
  // Get user phone
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("phone_number, first_name")
    .eq("user_id", userId)
    .single();

  if (!profile?.phone_number) {
    throw new Error("User phone not found");
  }

  const message = replaceVariables(config.message || "", profile);

  // Send via existing send-sms function
  await supabase.functions.invoke("send-sms", {
    body: {
      to: profile.phone_number,
      message,
      userId,
      campaignId: goalId
    }
  });
}

async function sendInboxMessage(supabase: any, userId: string, config: any, executionId: string) {
  await supabase
    .from("inbox_messages")
    .insert({
      user_id: userId,
      sequence_execution_id: executionId,
      from_name: config.from || "JRNY Team",
      subject: config.subject,
      message: config.message || config.content,
      message_type: "marketing"
    });
}

async function queuePopup(supabase: any, userId: string, config: any, executionId: string) {
  // Insert popup for display on next login
  await supabase
    .from("popup_displays")
    .insert({
      user_id: userId,
      sequence_execution_id: executionId,
      popup_type: config.trigger || "offer",
      content: {
        title: config.subject || config.content,
        message: config.message,
        discount_eligibility: config.discount_eligibility
      }
    });
}

function replaceVariables(text: string, profile: any): string {
  return text
    .replace(/{{first_name}}/g, profile.first_name || "there")
    .replace(/{{last_name}}/g, profile.last_name || "")
    .replace(/{{product_link}}/g, "[Product Link]")
    .replace(/{{discount_code}}/g, "JRNY30");
}