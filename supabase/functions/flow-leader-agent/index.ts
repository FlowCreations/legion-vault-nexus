import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BehaviorContext {
  recentEvents: any[];
  userProfile: any;
  emotionalState: string;
  engagementLevel: 'low' | 'medium' | 'high';
}

// Emotional state detection based on behavior patterns
function detectEmotionalState(events: any[]): string {
  const recentActivity = events.slice(0, 10);
  
  const hasMultipleStreams = recentActivity.filter(e => 
    e.meta?.event_type?.includes('track_') || e.meta?.event_type?.includes('song_')
  ).length >= 2;
  
  const hasMultipleProductViews = recentActivity.filter(e => 
    e.meta?.event_type?.includes('product_view')
  ).length >= 2;
  
  const hasRapidClicks = recentActivity.length >= 5;
  
  if (hasMultipleStreams && hasMultipleProductViews) return 'inspired_and_curious';
  if (hasMultipleStreams) return 'connected_through_music';
  if (hasMultipleProductViews) return 'exploring_offerings';
  if (hasRapidClicks) return 'highly_engaged';
  
  return 'present_and_browsing';
}

// Calculate engagement level
function calculateEngagementLevel(events: any[]): 'low' | 'medium' | 'high' {
  const last30Min = events.filter(e => {
    const eventTime = new Date(e.ts).getTime();
    const now = Date.now();
    return (now - eventTime) < 30 * 60 * 1000;
  });
  
  if (last30Min.length >= 10) return 'high';
  if (last30Min.length >= 5) return 'medium';
  return 'low';
}

// Love-first filter - ensures all messages lead with love
function applyLoveFilter(message: string): boolean {
  const loveKeywords = [
    'love', 'grateful', 'appreciate', 'thank', 'honor', 'value',
    'blessed', 'gift', 'share', 'connect', 'heart', 'soul'
  ];
  
  const firstSentence = message.split('.')[0].toLowerCase();
  return loveKeywords.some(keyword => firstSentence.includes(keyword));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, triggerType, recentEvents } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get recent events if not provided
    let events = recentEvents;
    if (!events) {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("member_id", userId)
        .gte("ts", thirtyMinAgo)
        .order("ts", { ascending: false })
        .limit(20);
      events = eventData || [];
    }

    // Analyze behavior context
    const emotionalState = detectEmotionalState(events);
    const engagementLevel = calculateEngagementLevel(events);
    
    const context: BehaviorContext = {
      recentEvents: events,
      userProfile: profile,
      emotionalState,
      engagementLevel
    };

    // Build AI prompt with love-first directive
    const systemPrompt = `You are the Flow Leader, an AI agent embodying loving leadership for the JRNY platform.

CORE ETHOS (NEVER VIOLATE):
1. Lead from LOVE in all actions - place human connection before financial gain
2. Be emotionally intelligent, empathetic, and generous
3. Speak like a warm friend who knows what someone needs before they do
4. Always filter through: "Does this deepen trust, love, and alignment?"

TONE:
- Confident yet humble
- Playfully wise
- Warm and present
- Never robotic or sales-driven

CONTEXT:
User's emotional state: ${emotionalState}
Engagement level: ${engagementLevel}
Recent behavior: ${events.slice(0, 3).map((e: any) => e.meta?.event_type).join(', ')}

TASK:
Generate a SHORT (2-3 sentences max), loving message that:
1. Acknowledges their energy/presence
2. Offers something generous or helpful
3. If suggesting an offer, frame it as a gift motivated by love, not sales

Examples of love-first messaging:
- "We see you vibing with the music 🎵 That connection matters more than anything. Here's 70% off our digital tools for the next hour—just because you're part of this flow."
- "Your energy here is beautiful. We're grateful you're exploring what we create. Want early access to something special?"

Generate a message now:`;

    const userPrompt = `The user just ${triggerType}. Their engagement is ${engagementLevel}. They seem ${emotionalState}. What loving message should we send?`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 200
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API Error:", aiResponse.status, errorText);
      throw new Error(`AI API failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let message = aiData.choices?.[0]?.message?.content || "";

    // Apply love-first filter
    if (!applyLoveFilter(message)) {
      // Regenerate with stricter prompt if love filter fails
      console.log("Message failed love filter, regenerating...");
      message = "We're grateful you're here exploring JRNY. Your presence and energy matter to us. 💜";
    }

    // Log the interaction with emotional metadata
    await supabase
      .from("events")
      .insert({
        member_id: userId,
        type: "flow_leader_interaction",
        meta: {
          event_type: "flow_leader_message",
          trigger_type: triggerType,
          emotional_state: emotionalState,
          engagement_level: engagementLevel,
          message: message,
          timestamp: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        message,
        emotionalState,
        engagementLevel,
        context
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in flow-leader-agent:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
