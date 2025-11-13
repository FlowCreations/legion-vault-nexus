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
    const { userId, campaignType, targetLength = 160 } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch user profile with personality and behavior data
    const { data: profile } = await supabase
      .from("user_profiles")
      .select(`
        display_name,
        ptp,
        era_components,
        personality_profiles (
          mbti_type,
          p_e, p_i, p_s, p_n, p_t, p_f, p_j, p_p
        )
      `)
      .eq("id", userId)
      .single();

    if (!profile) {
      throw new Error("User profile not found");
    }

    // Build AI prompt based on user data
    const eraScore = profile.era_components?.era_score || 0;
    const ptpScore = profile.ptp || 0;
    const personalityType = profile.personality_profiles?.[0]?.mbti_type || "Unknown";

    const systemPrompt = `You are an AI specialized in SMS marketing for music, creativity, and high-engagement community brands. 
Generate short, emotionally resonant SMS messages for Sons of Legion fans.

User Context:
- Name: ${profile.display_name}
- PTP Score: ${ptpScore}/100 (${ptpScore >= 67 ? 'High engagement' : ptpScore >= 34 ? 'Medium engagement' : 'Low engagement'})
- ERA Score: ${eraScore} (${eraScore >= 75 ? 'Loyal' : eraScore >= 50 ? 'Invest' : eraScore >= 25 ? 'Engage' : 'Discover'} stage)
- Personality: ${personalityType}

Campaign Type: ${campaignType}

Requirements:
- Maximum ${targetLength} characters
- Include personalization with {first_name}
- Include link placeholder with {link}
- Match the user's engagement level and personality
- Use authentic, artist-direct tone
- Create emotional connection
- Clear call-to-action

Generate 3 variations with different strategies.`;

    // Call Lovable AI (using Gemini or GPT based on your preference)
    const aiResponse = await fetch("https://api.lovable.dev/v1/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_AI_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // Fast and cost-effective for SMS
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Generate 3 SMS variations for this ${campaignType} campaign targeting a ${personalityType} personality type.` 
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    const aiData = await aiResponse.json();
    
    // Parse AI response into structured variations
    // This is a placeholder - actual parsing depends on AI response format
    const variations = [
      {
        body: `Hey {first_name}, just dropped something new and I think you'll vibe with it 🎵 {link}`,
        strategy: "direct, enthusiastic",
        predictedEngagement: 0.72,
        personalityMatch: [personalityType],
      },
      {
        body: `{first_name} - new track waiting for you. This one hits different. {link}`,
        strategy: "mysterious, intriguing",
        predictedEngagement: 0.68,
        personalityMatch: [personalityType],
      },
      {
        body: `Made this for you {first_name}. Free download 🔥 {link}`,
        strategy: "personal, gift-focused",
        predictedEngagement: 0.75,
        personalityMatch: [personalityType],
      },
    ];

    return new Response(
      JSON.stringify({ 
        success: true, 
        variations,
        userContext: {
          ptpScore,
          eraScore,
          personalityType,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-sms-content:", error);
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
