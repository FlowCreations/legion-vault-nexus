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
    const { videoTitle, frames, metadata } = await req.json();

    if (!frames || frames.length === 0) {
      throw new Error('No frames provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Construct the analysis prompt
    const systemPrompt = `You are an expert viral content analyst trained on successful video patterns across platforms like YouTube, TikTok, and Instagram.

Analyze the provided video frames and return a structured analysis with:

1. **Overall Score (0-100)**: Based on viral potential
2. **Hook Score (0-100)**: First 3 seconds effectiveness
3. **Pacing Score (0-100)**: Scene change frequency and energy consistency
4. **Visual Score (0-100)**: Visual engagement, face presence, movement, color vibrancy
5. **Drop-off Points**: Timestamps where viewers are likely to leave with risk percentage and reason
6. **Recommendations**: Specific actionable suggestions with timestamps and priority level

**Viral Video Patterns to Check:**
- First 3 seconds MUST grab attention (movement, face, text, action)
- Scene changes every 3-7 seconds optimal for retention
- Face presence increases retention 40%
- Text overlays boost completion 25%
- Visual variety prevents drop-off
- Energy/pacing consistency throughout
- Clear visual storytelling

**Analysis Guidelines:**
- Be specific with timestamps
- Provide actionable suggestions
- Identify exact moments of concern
- Consider platform best practices
- Focus on retention optimization`;

    // Prepare content for the AI with frames
    const userContent = [
      {
        type: "text",
        text: `Analyze this ${metadata.duration.toFixed(0)}-second video titled "${videoTitle}". 
I'm providing ${frames.length} frames extracted at regular intervals. 
Duration: ${metadata.duration.toFixed(2)}s
Resolution: ${metadata.width}x${metadata.height}

Please analyze and provide your assessment in the following JSON structure (use tool calling):
{
  "overallScore": <number 0-100>,
  "hookScore": <number 0-100>,
  "pacingScore": <number 0-100>,
  "visualScore": <number 0-100>,
  "dropoffPoints": [
    {
      "timestamp": <seconds>,
      "risk": <number 0-100>,
      "reason": "<specific reason>"
    }
  ],
  "recommendations": [
    {
      "timestamp": <seconds>,
      "suggestion": "<actionable suggestion>",
      "priority": "high" | "medium" | "low"
    }
  ]
}`
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
                  }
                },
                required: ["overallScore", "hookScore", "pacingScore", "visualScore", "dropoffPoints", "recommendations"]
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
