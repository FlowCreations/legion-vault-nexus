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
    const { symbolType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let prompt = '';
    
    if (symbolType === 'epiphany') {
      prompt = 'Create a luxurious golden sunburst symbol with radiating rays, ancient sacred geometry, ornate detailed center medallion with flower pattern, metallic gold gradient, transparent background, high detail, premium luxury feel, mystical enlightenment symbolism, 1024x1024';
    } else if (symbolType === 'oracle') {
      prompt = 'Create an ancient Greek oracle symbol with circular meander pattern border in cream and burgundy colors, sacred geometry basketball-like symbol in center, worn wood texture effect, mystical divination symbolism, transparent background, high detail, premium luxury aesthetic, 1024x1024';
    } else if (symbolType === 'catalyst') {
      prompt = 'Create a minimalist sacred geometry symbol with double overlapping triangles forming hourglass/diamond shape, clean white lines on dark textured stone background, ancient mystical power symbolism, elegant simplicity, transparent background option, high detail, premium luxury feel, transformation energy, 1024x1024';
    } else {
      throw new Error('Invalid symbol type');
    }

    console.log(`Generating ${symbolType} symbol with prompt:`, prompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    console.log(`Successfully generated ${symbolType} symbol`);

    return new Response(
      JSON.stringify({ imageUrl, symbolType }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error generating symbol:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate symbol';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
