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
    const { campaignId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all sends for this campaign
    const { data: sends, error: sendsError } = await supabase
      .from("email_sends")
      .select("*")
      .eq("campaign_id", campaignId);

    if (sendsError) throw sendsError;

    const totalSent = sends.length;
    const totalDelivered = sends.filter(s => !s.bounced).length;
    const totalOpened = sends.filter(s => s.opened_at).length;
    const totalClicked = sends.filter(s => s.clicked_at).length;
    const totalUnsubscribed = sends.filter(s => s.unsubscribed_at).length;

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;
    const clickToOpenRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
    const unsubscribeRate = totalDelivered > 0 ? (totalUnsubscribed / totalDelivered) * 100 : 0;

    // Calculate timeline data (opens/clicks by hour)
    const timeline = sends.reduce((acc: any, send) => {
      if (send.opened_at) {
        const hour = new Date(send.opened_at).getHours();
        acc.opens[hour] = (acc.opens[hour] || 0) + 1;
      }
      if (send.clicked_at) {
        const hour = new Date(send.clicked_at).getHours();
        acc.clicks[hour] = (acc.clicks[hour] || 0) + 1;
      }
      return acc;
    }, { opens: {}, clicks: {} });

    const analytics = {
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalUnsubscribed,
      deliveryRate: Math.round(deliveryRate * 10) / 10,
      openRate: Math.round(openRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
      clickToOpenRate: Math.round(clickToOpenRate * 10) / 10,
      unsubscribeRate: Math.round(unsubscribeRate * 10) / 10,
      timeline,
      lastComputed: new Date().toISOString(),
    };

    // Update campaign with computed analytics
    const { error: updateError } = await supabase
      .from("email_campaigns")
      .update({ analytics })
      .eq("id", campaignId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, analytics }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error computing campaign stats:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
