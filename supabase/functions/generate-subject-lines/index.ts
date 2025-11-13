import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubjectLineSuggestion {
  subject: string;
  targetPersonalities: string[];
  predictedOpenRate: number;
  strategy: string;
  charCount: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignType, tone, targetAudience, keywords } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch historical campaign performance
    const { data: campaigns, error: campaignsError } = await supabase
      .from('email_campaigns')
      .select('subject, analytics')
      .not('analytics', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
    }

    // Analyze past performance
    const performanceData = campaigns?.map(c => ({
      subject: c.subject,
      openRate: c.analytics?.openRate || 0
    })) || [];

    const avgOpenRate = performanceData.length > 0
      ? performanceData.reduce((sum, p) => sum + p.openRate, 0) / performanceData.length
      : 0.25; // Default baseline

    const topPerformers = performanceData
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 5);

    // Build AI prompt
    const systemPrompt = `You are an expert email marketing strategist for Sons of Legion, a Christ-conscious music and community brand. 

Your task is to generate high-converting email subject lines based on MBTI personality types and past campaign performance.

BRAND VOICE:
- Authentic and empowering
- Christ-conscious (love-first, truth-based, non-manipulative)
- Bold yet respectful
- Community-focused

PERSONALITY TYPE OPTIMIZATION:
- Extroverted (E): Bold, energetic, social language
- Introverted (I): Personal, intimate, exclusive language
- Sensing (S): Concrete, specific benefits
- Intuitive (N): Big-picture, visionary language
- Thinking (T): Logical value propositions
- Feeling (F): Emotional connection
- Judging (J): Deadline-driven, structured
- Perceiving (P): Open-ended, exploratory

BEST PRACTICES:
- Optimal length: 30-50 characters
- Use personalization when appropriate
- Create urgency without manipulation
- Be specific and benefit-driven
- Test emoji usage (sparingly)

HISTORICAL PERFORMANCE:
Average open rate: ${(avgOpenRate * 100).toFixed(1)}%
Top performing subjects: ${topPerformers.map(p => `"${p.subject}" (${(p.openRate * 100).toFixed(1)}%)`).join(', ')}

Generate subject lines that are authentic, engaging, and optimized for different personality types.`;

    const userPrompt = `Generate 6 email subject line variations for a ${campaignType} campaign.

Target Audience: ${JSON.stringify(targetAudience)}
Tone: ${tone}
${keywords ? `Keywords to include: ${keywords}` : ''}

Create variations that appeal to different personality types while maintaining the Sons of Legion brand voice.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_subject_lines',
            description: 'Generate email subject line suggestions with personality targeting',
            parameters: {
              type: 'object',
              properties: {
                suggestions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      subject: { type: 'string', description: 'The subject line text' },
                      targetPersonalities: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'MBTI types this subject line targets (e.g., ENFP, ISTJ)'
                      },
                      predictedOpenRate: { 
                        type: 'number', 
                        description: 'Predicted open rate between 0 and 1'
                      },
                      strategy: { 
                        type: 'string', 
                        description: 'Brief explanation of the strategy behind this subject line'
                      }
                    },
                    required: ['subject', 'targetPersonalities', 'predictedOpenRate', 'strategy']
                  },
                  minItems: 5,
                  maxItems: 7
                }
              },
              required: ['suggestions']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_subject_lines' } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const suggestions: SubjectLineSuggestion[] = JSON.parse(toolCall.function.arguments).suggestions;

    // Add character count to each suggestion
    const enrichedSuggestions = suggestions.map(s => ({
      ...s,
      charCount: s.subject.length
    }));

    return new Response(
      JSON.stringify({ 
        suggestions: enrichedSuggestions,
        averageHistoricalOpenRate: avgOpenRate
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in generate-subject-lines:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
