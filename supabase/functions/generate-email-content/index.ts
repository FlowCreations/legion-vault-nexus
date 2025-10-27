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

    const systemPrompt = `You are an expert email marketing copywriter for musicians and artists. 
Create engaging, authentic email content that drives fan engagement and conversions.
Keep the tone ${tone} and write in a way that feels personal and genuine.`;

    const userPrompt = `Create email content for a music artist's campaign with these details:

Goal: ${campaignGoal}
Target Audience: ${targetAudience.name} (${targetAudience.memberCount} fans)
Audience Filters: ${JSON.stringify(targetAudience.filters || {})}
${includeOffer ? 'Include a special offer or call-to-action' : ''}

Generate:
1. Three compelling subject line variations (40-60 characters each)
2. A complete email body (300-500 words) with proper greeting, body, and closing
3. Three call-to-action button text suggestions
4. Preview text for email inbox (50-100 characters)

Use personalization tokens like {{user_name}}, {{ptp_score}}, {{era_label}} where appropriate.
Make it feel authentic and personal, not corporate or salesy.`;

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
