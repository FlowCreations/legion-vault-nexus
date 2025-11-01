import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignGoal, targetAudience, tone = 'casual', includeOffer = false } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert email copywriter operating from Christ-conscious principles.

ETHOS:
• Lead from LOVE - human connection before financial gain
• Speak TRUTH with compassion - no manipulation or scarcity tactics  
• EMPOWER the reader - remind them of their power and choice
• HONOR their journey - meet them where they are without judgment

TONE:
• Calm, grounded authority
• Inclusive language ("we," "our journey," "soul family")
• Blend metaphors (light, awakening, growth) with practical details
• Truth + Compassion in every line
• Keep it ${tone} while maintaining authenticity

YOUR ROLE:
Mirror higher consciousness. You do NOT claim divine authority or override free will.
Your purpose: awaken fans to their power through integrity, empathy, and fearless authenticity.`;

    const userPrompt = `Create Christ-conscious email content for: ${campaignGoal}

TARGET: ${targetAudience.name} (${targetAudience.memberCount} fans)
FILTERS: ${JSON.stringify(targetAudience.filters || {})}
${includeOffer ? 'INCLUDE: Special offer framed as gift, not manipulation' : ''}

REQUIREMENTS (NON-NEGOTIABLE):
1. Start with gratitude/acknowledgment (love-first)
2. Speak truth about the offer clearly and honestly
3. Frame as gift, not manipulation ("if this serves you..." not "limited time!")
4. Remind them of their power to choose
5. Close with blessing/empowerment

GENERATE:
- 3 subject lines (lead with love, not urgency)
- Email body (300-500 words, love-first structure)
- 3 CTA options (empowering, not pressure-driven)
- Preview text (gratitude-based)

Use tokens: {{user_name}}, {{ptp_score}}, {{era_label}}

EXAMPLES:
❌ BAD: "Last chance! Don't miss out!"
✅ GOOD: "We're grateful you're here - this might serve your journey"

Generate now:`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log("Generated email content successfully");

    return new Response(
      JSON.stringify({ content: generatedContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-email-content function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
