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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { videoId, imageBase64 } = await req.json();

    if (!videoId || !imageBase64) {
      throw new Error('videoId and imageBase64 are required');
    }

    // Convert base64 to blob
    const base64Data = imageBase64.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `manual/${videoId}_${Date.now()}.jpg`;
    
    const { error: uploadError } = await supabaseClient.storage
      .from('thumbnails')
      .upload(fileName, binaryData, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseClient.storage
      .from('thumbnails')
      .getPublicUrl(fileName);

    const { error: updateError } = await supabaseClient
      .from('videos')
      .update({ thumbnail_url: publicUrl })
      .eq('id', videoId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, url: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
