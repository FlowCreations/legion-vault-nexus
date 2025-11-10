import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the logo from the project's public URL
    const logoResponse = await fetch(`${supabaseUrl.replace('.supabase.co', '.lovableproject.com')}/sol-logo-email.png`);
    
    if (!logoResponse.ok) {
      throw new Error(`Failed to fetch logo: ${logoResponse.status}`);
    }

    const logoBlob = await logoResponse.blob();
    const logoBuffer = await logoBlob.arrayBuffer();

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload('sol-logo-new.png', logoBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl('sol-logo-new.png');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Logo uploaded successfully',
        publicUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error uploading logo:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
