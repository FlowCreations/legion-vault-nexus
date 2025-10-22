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
    const { videoTitle, platform, frames, metadata } = await req.json();

    if (!frames || frames.length === 0) {
      throw new Error('No frames provided');
    }

    if (!platform) {
      throw new Error('Platform not specified');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Platform-specific best practices
    const platformGuidelines: Record<string, string> = {
      tiktok: `
**TikTok Best Practices:**
- First 3 seconds MUST hook or viewers scroll (extremely critical)
- Ideal length: 21-34 seconds for maximum engagement
- Vertical 9:16 format required
- Fast cuts every 1-3 seconds keep attention
- On-screen text/captions boost retention 40%
- Trending sounds increase discoverability 3x
- Face-to-camera shots perform 2x better
- Jump cuts and quick transitions essential
- Authentic, raw content outperforms polished
- Hook must be visual + auditory for sound-off viewing`,
      
      youtube: `
**YouTube Best Practices:**
- First 30 seconds determine 50% of retention
- Thumbnail + title must promise value delivered in video
- Ideal length varies: 8-15 min for tutorials, 4-6 min for entertainment
- Pattern interrupts every 20-30 seconds maintain attention
- Clear story arc: hook → value → payoff
- Face presence in first 3 seconds increases clicks 20%
- End screens and CTAs boost channel growth
- Pacing should match content type (faster for entertainment)
- YouTube algorithm favors watch time over views`,
      
      instagram: `
**Instagram Reels Best Practices:**
- First frame must be eye-catching (users decide in <1 second)
- 15-30 seconds optimal for completion rate
- Vertical 9:16 format essential
- Aesthetic quality matters more than on TikTok
- On-beat transitions boost engagement
- Trending audio increases reach 5x
- Text overlays critical (80% watch without sound)
- Hook in first 2 seconds or users swipe
- Visual variety every 3-5 seconds
- Strong call-to-action in caption`,
      
      "youtube-shorts": `
**YouTube Shorts Best Practices:**
- Similar to TikTok but slightly longer hooks work (3-5 sec)
- 30-60 seconds ideal length
- Loop-able content gets re-watched
- Clear, loud audio important
- Vertical format required
- Fast pacing but slightly less frantic than TikTok
- Timestamps and chapters don't work in Shorts
- Strong first frame (acts as thumbnail)`,
      
      facebook: `
**Facebook Best Practices:**
- Auto-play starts muted - visual hook essential
- Square (1:1) or vertical (4:5) outperforms horizontal
- Longer form content (2-5 min) performs well
- Emotional storytelling drives shares
- Captions required (85% watch without sound)
- Native uploads outperform YouTube links 10x
- Community engagement in comments boosts reach`,
      
      twitter: `
**Twitter/X Best Practices:**
- 20-45 seconds optimal (attention spans very short)
- Square format (1:1) best for feed
- First 2 seconds critical - users scroll fast
- Provocative/controversial hooks drive engagement
- Subtitles essential
- Memes and trends spread fastest
- Keep it punchy and quotable`
    };

    const platformGuide = platformGuidelines[platform] || platformGuidelines.tiktok;

    // Construct the analysis prompt
    const systemPrompt = `You are an expert viral content analyst specializing in ${platform.toUpperCase()} content optimization.

Analyze the provided video frames and return a comprehensive, platform-specific analysis.

${platformGuide}

**Analysis Requirements:**

1. **Overall Score (0-100)**: Based on viral potential specifically for ${platform}
2. **Hook Score (0-100)**: Effectiveness of opening based on ${platform} standards
3. **Pacing Score (0-100)**: Scene changes and energy for ${platform} algorithm
4. **Visual Score (0-100)**: Visual quality and engagement for ${platform} audience
5. **Drop-off Points**: Exact timestamps where ${platform} viewers will likely leave
6. **Recommendations**: Platform-specific actionable suggestions
7. **Platform Insights**: 
   - Viral potential percentage for ${platform}
   - Alternative platforms this would work on
   - Format adjustments needed for ${platform}

**Critical ${platform} Patterns to Check:**
- Hook timing and effectiveness for platform
- Optimal video length for platform
- Aspect ratio suitability
- Pacing appropriate for platform algorithm
- Visual style matching platform trends
- Audio/text overlay requirements
- Platform-specific editing techniques

Be ruthless but constructive. Provide specific timestamps and clear actions.`;

    const userContent = [
      {
        type: "text",
        text: `Analyze this ${metadata.duration.toFixed(0)}-second video titled "${videoTitle}" for ${platform.toUpperCase()}. 
I'm providing ${frames.length} frames extracted at regular intervals.
Duration: ${metadata.duration.toFixed(2)}s
Resolution: ${metadata.width}x${metadata.height}
Target Platform: ${platform}

Provide comprehensive ${platform}-specific analysis including viral potential, format recommendations, and whether this content would work better on other platforms.`
      }
    ];

    // Add frames as images
    frames.forEach((frame: any, idx: number) => {
      userContent.push({
        type: "image_url" as const,
        image_url: {
          url: `data:image/jpeg;base64,${frame.image}`
        }
      } as any);
      userContent.push({
        type: "text",
        text: `Frame ${idx + 1} at ${frame.timestamp.toFixed(1)}s`
      });
    });

    // Call Lovable AI with tool calling for structured output
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_video_content",
              description: "Analyze video content and return structured performance metrics",
              parameters: {
                type: "object",
                properties: {
                  overallScore: {
                    type: "number",
                    description: "Overall viral potential score 0-100"
                  },
                  hookScore: {
                    type: "number",
                    description: "First 3 seconds effectiveness score 0-100"
                  },
                  pacingScore: {
                    type: "number",
                    description: "Pacing and energy consistency score 0-100"
                  },
                  visualScore: {
                    type: "number",
                    description: "Visual engagement score 0-100"
                  },
                  dropoffPoints: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        timestamp: { type: "number" },
                        risk: { type: "number" },
                        reason: { type: "string" }
                      },
                      required: ["timestamp", "risk", "reason"]
                    }
                  },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        timestamp: { type: "number" },
                        suggestion: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] }
                      },
                      required: ["timestamp", "suggestion", "priority"]
                    }
                  },
                  platformInsights: {
                    type: "object",
                    properties: {
                      viralPotential: { 
                        type: "number",
                        description: `Viral potential percentage specifically for ${platform} (0-100)`
                      },
                      bestPlatforms: {
                        type: "array",
                        items: { type: "string" },
                        description: "Other platforms this content would perform well on"
                      },
                      formatRecommendations: {
                        type: "array",
                        items: { type: "string" },
                        description: `Specific format adjustments for ${platform}`
                      }
                    }
                  }
                },
                required: ["overallScore", "hookScore", "pacingScore", "visualScore", "dropoffPoints", "recommendations", "platformInsights"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_video_content" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('AI credits depleted. Please add funds to your Lovable workspace.');
      }
      
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI response:', JSON.stringify(aiResponse, null, 2));

    // Extract the tool call result
    const toolCall = aiResponse.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No analysis result from AI');
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        ...analysisResult,
        metadata
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in analyze-content-performance:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to analyze content',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
