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
    const {
      userId,
      channelType,
      interactionType,
      campaignId,
      goalId,
      sequenceId,
      metadata
    } = await req.json();

    if (!userId || !channelType || !interactionType) {
      throw new Error("Missing required fields");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert interaction event
    const { error: insertError } = await supabase
      .from("marketing_interactions")
      .insert({
        user_id: userId,
        channel_type: channelType,
        interaction_type: interactionType,
        campaign_id: campaignId,
        goal_id: goalId,
        sequence_id: sequenceId,
        metadata: metadata || {}
      });

    if (insertError) throw insertError;

    // Update user engagement state
    await updateEngagementState(supabase, userId, channelType, interactionType);

    // Find active sequence executions for this user
    const { data: activeExecutions } = await supabase
      .from("sequence_executions")
      .select("id, sequence_id, current_decision_node")
      .eq("user_id", userId)
      .eq("status", "active")
      .eq("sequence_id", sequenceId);

    // Process each active sequence
    for (const execution of activeExecutions || []) {
      // Determine the interaction type for the decision engine
      const decisionInteractionType = mapInteractionToDecision(interactionType, channelType);
      
      // Call execute-adaptive-sequence to process the next step
      await supabase.functions.invoke("execute-adaptive-sequence", {
        body: {
          sequenceExecutionId: execution.id,
          lastInteractionType: decisionInteractionType
        }
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in track-interaction-event:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function updateEngagementState(
  supabase: any,
  userId: string,
  channelType: string,
  interactionType: string
) {
  const now = new Date().toISOString();
  const updates: any = {};

  // Update channel-specific timestamps
  if (channelType === "email") {
    if (interactionType === "sent") {
      updates.last_email_sent = now;
    }
    if (interactionType === "opened") {
      updates.consecutive_no_opens = 0;
      updates.email_engagement_level = "hot";
    }
  } else if (channelType === "sms") {
    if (interactionType === "sent") {
      updates.last_sms_sent = now;
    }
    if (interactionType === "clicked") {
      updates.consecutive_sms_interactions = supabase.raw("consecutive_sms_interactions + 1");
    }
  } else if (channelType === "inbox") {
    if (interactionType === "sent") {
      updates.last_inbox_sent = now;
    }
    if (interactionType === "opened") {
      updates.inbox_engagement_level = "active";
    }
  } else if (channelType === "popup") {
    if (interactionType === "sent") {
      updates.last_popup_shown = now;
    }
    if (interactionType === "closed") {
      updates.consecutive_popup_dismissals = supabase.raw("consecutive_popup_dismissals + 1");
      
      // Block popups after 2 consecutive dismissals
      const { data: currentState } = await supabase
        .from("user_engagement_state")
        .select("consecutive_popup_dismissals")
        .eq("user_id", userId)
        .single();

      if (currentState && currentState.consecutive_popup_dismissals >= 1) {
        updates.popup_cooldown_until = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
        updates.popup_engagement_level = "blocked";
      }
    }
    if (interactionType === "clicked") {
      updates.consecutive_popup_dismissals = 0;
      updates.popup_engagement_level = "responsive";
    }
  }

  // Handle conversions
  if (interactionType === "converted") {
    updates.last_conversion = now;
    updates.global_cooldown_until = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  }

  if (Object.keys(updates).length > 0) {
    await supabase
      .from("user_engagement_state")
      .upsert({
        user_id: userId,
        ...updates
      });
  }
}

function mapInteractionToDecision(interactionType: string, channelType: string): string {
  // Map raw interaction types to decision tree keys
  const mapping: Record<string, string> = {
    "opened": channelType === "email" ? "opened" : "opened",
    "clicked": channelType === "email" ? "opened_and_clicked" : "clicked",
    "sent": "sent",
    "delivered": channelType === "sms" ? "delivered_no_open" : "delivered",
    "closed": "closed",
    "ignored": "ignored",
    "converted": "converted"
  };

  return mapping[interactionType] || interactionType;
}