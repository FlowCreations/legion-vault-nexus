import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DecisionNode {
  type: 'email' | 'sms' | 'inbox' | 'popup' | 'wait' | 'completion';
  subject?: string;
  body_template_id?: string;
  message?: string;
  content?: string;
  from?: string;
  wait_for?: string;
  duration_hours?: number;
  send_time_optimization?: boolean;
  time_optimization?: { priority: string[] };
  discount_eligibility?: string;
  trigger?: string;
  next_decisions?: Record<string, string>;
  next_node?: string;
  action?: string;
  cooldown_hours?: number;
  variant?: string;
}

interface DecisionTree {
  entry_node: string;
  nodes: Record<string, DecisionNode>;
  fatigue_rules: {
    max_email_24h: number;
    max_sms_72h: number;
    max_inbox_48h: number;
    max_popup_72h: number;
    channel_priority: string[];
    global_cooldown_after_purchase: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sequenceExecutionId, lastInteractionType } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch sequence execution
    const { data: execution, error: execError } = await supabase
      .from("sequence_executions")
      .select(`
        *,
        adaptive_sequences!inner(decision_tree, fatigue_rules),
        user_engagement_state(*)
      `)
      .eq("id", sequenceExecutionId)
      .single();

    if (execError || !execution) {
      throw new Error("Sequence execution not found");
    }

    const decisionTree = execution.adaptive_sequences.decision_tree as DecisionTree;
    const currentNode = decisionTree.nodes[execution.current_decision_node];
    
    if (!currentNode) {
      throw new Error(`Invalid decision node: ${execution.current_decision_node}`);
    }

    // Get user's engagement state
    const { data: engagementState } = await supabase
      .from("user_engagement_state")
      .select("*")
      .eq("user_id", execution.user_id)
      .single();

    // Check global fatigue rules
    const fatigueCheck = await checkFatigueRules(
      supabase,
      execution.user_id,
      decisionTree.fatigue_rules,
      engagementState
    );

    if (!fatigueCheck.allowed) {
      console.log(`Fatigue prevention blocked action: ${fatigueCheck.reason}`);
      
      // Reschedule for later
      const { error: updateError } = await supabase
        .from("sequence_executions")
        .update({
          next_action_scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            ...execution.metadata,
            fatigue_blocked_at: new Date().toISOString(),
            fatigue_reason: fatigueCheck.reason
          }
        })
        .eq("id", sequenceExecutionId);

      return new Response(
        JSON.stringify({ success: true, action: "delayed_due_to_fatigue" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine next decision based on last interaction
    let nextNodeKey = determineNextNode(currentNode, lastInteractionType);
    
    if (!nextNodeKey && currentNode.next_node) {
      nextNodeKey = currentNode.next_node;
    }

    if (!nextNodeKey) {
      console.log("No next node found, ending sequence");
      await supabase
        .from("sequence_executions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", sequenceExecutionId);

      return new Response(
        JSON.stringify({ success: true, action: "sequence_completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nextNode = decisionTree.nodes[nextNodeKey];

    if (nextNode.type === "completion") {
      // Handle goal achievement
      await supabase
        .from("sequence_executions")
        .update({
          status: "goal_achieved",
          completed_at: new Date().toISOString()
        })
        .eq("id", sequenceExecutionId);

      // Set global cooldown
      const cooldownHours = nextNode.cooldown_hours || 72;
      await supabase
        .from("user_engagement_state")
        .upsert({
          user_id: execution.user_id,
          global_cooldown_until: new Date(Date.now() + cooldownHours * 60 * 60 * 1000).toISOString(),
          last_conversion: new Date().toISOString()
        });

      return new Response(
        JSON.stringify({ success: true, action: "goal_achieved" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Schedule next action based on node type
    const nextActionTime = calculateNextActionTime(nextNode);
    const nextActionConfig = prepareActionConfig(nextNode, execution.user_id);

    // Update sequence execution
    await supabase
      .from("sequence_executions")
      .update({
        current_decision_node: nextNodeKey,
        next_action_scheduled_for: nextActionTime,
        next_action_type: nextNode.type,
        next_action_config: nextActionConfig,
        decision_history: [
          ...(execution.decision_history || []),
          {
            node: execution.current_decision_node,
            interaction: lastInteractionType,
            next_node: nextNodeKey,
            timestamp: new Date().toISOString()
          }
        ]
      })
      .eq("id", sequenceExecutionId);

    return new Response(
      JSON.stringify({
        success: true,
        next_action: {
          type: nextNode.type,
          scheduled_for: nextActionTime,
          config: nextActionConfig
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in execute-adaptive-sequence:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function checkFatigueRules(
  supabase: any,
  userId: string,
  fatigueRules: any,
  engagementState: any
): Promise<{ allowed: boolean; reason?: string }> {
  // Check global cooldown
  if (engagementState?.global_cooldown_until) {
    const cooldownDate = new Date(engagementState.global_cooldown_until);
    if (cooldownDate > new Date()) {
      return { allowed: false, reason: "Global cooldown active (post-purchase)" };
    }
  }

  // Check popup cooldown
  if (engagementState?.popup_cooldown_until) {
    const popupCooldown = new Date(engagementState.popup_cooldown_until);
    if (popupCooldown > new Date()) {
      return { allowed: false, reason: "Popup cooldown active" };
    }
  }

  // Check channel-specific limits
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const last72h = new Date(now.getTime() - 72 * 60 * 60 * 1000);

  const { data: recentInteractions } = await supabase
    .from("marketing_interactions")
    .select("channel_type, interaction_timestamp")
    .eq("user_id", userId)
    .gte("interaction_timestamp", last72h.toISOString());

  const emailLast24h = recentInteractions?.filter(
    (i: any) => i.channel_type === "email" && new Date(i.interaction_timestamp) > last24h
  ).length || 0;

  const smsLast72h = recentInteractions?.filter(
    (i: any) => i.channel_type === "sms" && new Date(i.interaction_timestamp) > last72h
  ).length || 0;

  const inboxLast48h = recentInteractions?.filter(
    (i: any) => i.channel_type === "inbox" && new Date(i.interaction_timestamp) > last48h
  ).length || 0;

  const popupLast72h = recentInteractions?.filter(
    (i: any) => i.channel_type === "popup" && new Date(i.interaction_timestamp) > last72h
  ).length || 0;

  if (emailLast24h >= fatigueRules.max_email_24h) {
    return { allowed: false, reason: `Email limit reached (${fatigueRules.max_email_24h}/24h)` };
  }

  if (smsLast72h >= fatigueRules.max_sms_72h) {
    return { allowed: false, reason: `SMS limit reached (${fatigueRules.max_sms_72h}/72h)` };
  }

  if (inboxLast48h >= fatigueRules.max_inbox_48h) {
    return { allowed: false, reason: `Inbox limit reached (${fatigueRules.max_inbox_48h}/48h)` };
  }

  if (popupLast72h >= fatigueRules.max_popup_72h) {
    return { allowed: false, reason: `Popup limit reached (${fatigueRules.max_popup_72h}/72h)` };
  }

  return { allowed: true };
}

function determineNextNode(currentNode: DecisionNode, interactionType: string | null): string | null {
  if (!currentNode.next_decisions || !interactionType) {
    return null;
  }

  // Map interaction types to decision keys
  const interactionMap: Record<string, string> = {
    "opened": "opened",
    "opened_and_clicked": "opened_and_clicked",
    "opened_no_click": "opened_no_click",
    "not_opened": "not_opened",
    "clicked": "clicked",
    "delivered_no_open": "delivered_no_open",
    "converted": "converted",
    "closed": "closed",
    "ignored": "ignored"
  };

  const decisionKey = interactionMap[interactionType];
  return decisionKey ? currentNode.next_decisions[decisionKey] : null;
}

function calculateNextActionTime(node: DecisionNode): string {
  if (node.type === "wait") {
    const hours = node.duration_hours || 24;
    return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  }

  // Parse wait_for strings like "24_hours", "24_to_36_hours"
  if (node.wait_for) {
    const match = node.wait_for.match(/(\d+)(?:_to_(\d+))?_hours?/);
    if (match) {
      const minHours = parseInt(match[1]);
      const maxHours = match[2] ? parseInt(match[2]) : minHours;
      const hours = minHours + Math.random() * (maxHours - minHours);
      return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    }
  }

  // Default to immediate execution (or next processing window)
  return new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes buffer
}

function prepareActionConfig(node: DecisionNode, userId: string): any {
  return {
    type: node.type,
    subject: node.subject,
    message: node.message,
    content: node.content,
    from: node.from,
    body_template_id: node.body_template_id,
    send_time_optimization: node.send_time_optimization,
    time_optimization: node.time_optimization,
    discount_eligibility: node.discount_eligibility,
    trigger: node.trigger,
    variant: node.variant
  };
}