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
    const { sendId, eventType } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const updateData: any = {};
    
    switch (eventType) {
      case "opened":
        updateData.opened_at = new Date().toISOString();
        break;
      case "clicked":
        updateData.clicked_at = new Date().toISOString();
        break;
      case "unsubscribed":
        updateData.unsubscribed_at = new Date().toISOString();
        break;
      case "bounced":
        updateData.bounced = true;
        break;
    }

    const { error } = await supabase
      .from("email_sends")
      .update(updateData)
      .eq("id", sendId);

    if (error) throw error;

    // Track as event for ERA/PTP scoring
    if (eventType === "opened" || eventType === "clicked") {
      const { data: send } = await supabase
        .from("email_sends")
        .select("user_id, campaign_id")
        .eq("id", sendId)
        .single();

      if (send?.user_id) {
        await supabase.from("events").insert({
          member_id: send.user_id,
          type: eventType === "opened" ? "email_open" : "email_click",
          content_id: send.campaign_id,
          value: eventType === "clicked" ? 2 : 1,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error tracking email event:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
