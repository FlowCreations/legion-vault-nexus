import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { vodId, title, description } = await req.json();

    if (!vodId) {
      throw new Error('VOD ID is required');
    }

    console.log('[Thumbnail] Generating AI thumbnail for VOD:', vodId);

    // Create a detailed prompt for the thumbnail
    const prompt = `Create an engaging, professional thumbnail for a live stream recording titled "${title}". ${description ? `The stream is about: ${description}.` : ''} The thumbnail should be eye-catching with bold text overlay, vibrant colors, and a cinematic look suitable for a video streaming platform. Include visual elements that suggest live performance or entertainment. Make it 16:9 aspect ratio, high quality, with dramatic lighting.`;

    // Call Lovable AI Gateway for image generation
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
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
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      throw new Error('No image generated from AI');
    }

    console.log('[Thumbnail] AI image generated successfully');

    // Convert base64 to blob
    const base64Data = imageBase64.split(',')[1];
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const fileName = `vod-${vodId}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, imageBytes, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('[Thumbnail] Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(fileName);

    console.log('[Thumbnail] Uploaded to storage:', publicUrl);

    // Update VOD record with thumbnail URL
    const { error: updateError } = await supabase
      .from('livestream_vods')
      .update({ thumbnail_url: publicUrl })
      .eq('id', vodId);

    if (updateError) {
      console.error('[Thumbnail] Update error:', updateError);
      throw updateError;
    }

    console.log('[Thumbnail] VOD updated with thumbnail URL');

    return new Response(
      JSON.stringify({ success: true, thumbnailUrl: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Thumbnail] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
