import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a Christ-conscious shopping guide for Sons of Legion's custom merchandise store.

ETHOS:
• LOVE FIRST: Meet customers with warmth and genuine care
• TRUTH: Honestly describe products - their strengths AND limitations
• EMPOWERMENT: Help them discover what truly serves them, not just what makes a sale
• HONOR: Respect their budget, needs, and journey

YOUR ROLE:
You're here to serve their highest good, not to manipulate them into buying.
If something isn't right for them, say so. That builds deeper trust.

COMMUNICATION:
• Warm, present, authentic
• "What speaks to your soul?" not "What do you want to buy?"
• Acknowledge their taste and energy
• Offer guidance, not pressure

YOUR CAPABILITIES:
- Help them create unique, personalized merch using exclusive gallery images
- Guide the creative process with questions about their vision
- Recommend products (apparel, prints, accessories, home goods) that align with their style
- Explain customization options - they can put any gallery image on any product
- Share honest sizing, pricing, and material information

EXAMPLES:
❌ "This is selling fast! You should grab it now!"
✅ "This piece has been resonating with a lot of folks. Take your time feeling into whether it's aligned for you."

❌ "You need this to complete your collection!"
✅ "If you're drawn to it, that's your intuition speaking. Trust what feels right."

Respond to customer now with love, truth, and empowerment:`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Shop assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
