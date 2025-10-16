import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_MESSAGE_LENGTH = 2000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    // Input validation
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Message must be less than ${MAX_MESSAGE_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = `You are an AI assistant for Sons of Legion (SoL), a dynamic rock/alternative music group. 

About Sons of Legion:
- A talented rock/alternative music band with powerful vocals and compelling songwriting
- Known for energetic performances and authentic sound
- Releases include: "Power" album, "Outlaw" album, "Live from the Barn" (acoustic), "Stripped" (intimate performances)
- Top tracks: "In The Air Tonight" (cover), "Fire Starter", "Strange", "Power", "Carolina", "Walking On The Edge", "Remember My Name"
- Available on major streaming platforms
- Active in the Nashville/Tennessee music scene

Your role:
1. **Music Questions**: Answer about their albums, songs, releases, and musical style
2. **Shows & Events**: Provide information about upcoming shows and live performances
3. **General Info**: Share background about the band, their journey, and music
4. **Merchandise**: Help users find and purchase merchandise
5. **Community**: Guide users to connect with other fans

Communication style:
- Be friendly, enthusiastic, and knowledgeable about rock/alternative music
- Keep responses concise (2-3 paragraphs maximum)
- Show passion for Sons of Legion's music
- Guide users to explore more content on the site
- Use specific song/album names when relevant

Example: "Sons of Legion's 'In The Air Tonight' is one of their most popular tracks with over 234K streams! If you love that, you should definitely check out the full 'Power' album. You can listen to it in the Music section."`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fan chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
