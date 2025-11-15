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
      goalDescription,
      targetAudience,
      channelsEnabled,
      budgetTier
    } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create AI prompt for sequence generation
    const prompt = `You are a marketing automation expert specializing in multi-channel campaigns. Create an adaptive IF/THEN decision tree for this goal:

Goal: ${goalDescription}
Audience: ${targetAudience}
Channels: ${channelsEnabled.join(", ")}
Budget: ${budgetTier}

Follow JRNY's Hybrid Funnel rules:
- Max 1 email/24h, 1 SMS/72h, 1 popup/72h, 1 inbox/48h
- Use least intrusive channel first (email → inbox → popup → SMS)
- After conversion: 72h silence
- After 2 email no-opens: switch to SMS
- Include A/B test variants for emails
- Optimize send times per user timezone

Create a complete decision tree JSON with all IF/THEN nodes, timing delays, and channel fallbacks.

Return ONLY valid JSON in this exact structure:
{
  "goal": "string",
  "entry_node": "email_1",
  "nodes": {
    "email_1": {
      "type": "email",
      "subject": "string",
      "message": "string",
      "wait_for": "24_hours",
      "send_time_optimization": true,
      "next_decisions": {
        "opened_and_clicked": "popup_offer",
        "opened_no_click": "email_1b",
        "not_opened": "wait_48h_then_sms",
        "converted": "goal_achieved"
      }
    },
    ...more nodes
  },
  "fatigue_rules": {
    "max_email_24h": 1,
    "max_sms_72h": 1,
    "max_inbox_48h": 1,
    "max_popup_72h": 1,
    "channel_priority": ["email", "inbox", "popup", "sms"],
    "global_cooldown_after_purchase": 72
  }
}`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a marketing automation expert. Always return valid JSON only, no markdown or explanation."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error("Rate limits exceeded, please try again later");
      }
      if (aiResponse.status === 402) {
        throw new Error("Payment required, please add funds to your Lovable AI workspace");
      }
      throw new Error(`AI generation failed: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // Parse the JSON response (remove markdown if present)
    let decisionTree;
    try {
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiContent.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
      decisionTree = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("AI response:", aiContent);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate decision tree structure
    if (!decisionTree.nodes || !decisionTree.entry_node) {
      throw new Error("Invalid decision tree structure");
    }

    return new Response(
      JSON.stringify({
        success: true,
        decisionTree,
        sequenceName: `${goalDescription} - Adaptive Sequence`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in generate-adaptive-sequence:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});