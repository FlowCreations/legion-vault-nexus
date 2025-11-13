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
    const { userId, campaignId, conversionType, conversionValue, actionMetadata } = await req.json();

    if (!userId || !campaignId || !conversionType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`Tracking conversion: ${conversionType} for user ${userId}, campaign ${campaignId}`);

    // Update email_sends with purchased_at timestamp
    const { error: updateError } = await supabase
      .from("email_sends")
      .update({ purchased_at: new Date().toISOString() })
      .eq("campaign_id", campaignId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating email_sends:", updateError);
    }

    // Add to suppressions so they don't get more emails
    const { error: suppressError } = await supabase
      .from("email_campaign_suppressions")
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        reason: conversionType
      });

    if (suppressError && !suppressError.message?.includes("duplicate")) {
      console.error("Error creating suppression:", suppressError);
    }

    // Track the engagement action
    const { error: trackError } = await supabase
      .from("email_campaign_engagement_tracking")
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        action_type: conversionType,
        action_metadata: actionMetadata || {}
      });

    if (trackError) {
      console.error("Error tracking engagement:", trackError);
    }

    // Update campaign analytics
    const { data: campaign } = await supabase
      .from("email_campaigns")
      .select("analytics")
      .eq("id", campaignId)
      .single();

    if (campaign) {
      const analytics = campaign.analytics || {};
      const conversions = (analytics.conversions || 0) + 1;
      const totalRevenue = (analytics.totalRevenue || 0) + (conversionValue || 0);

      await supabase
        .from("email_campaigns")
        .update({
          analytics: {
            ...analytics,
            conversions,
            totalRevenue,
            conversionRate: analytics.totalSent > 0 
              ? ((conversions / analytics.totalSent) * 100).toFixed(2)
              : 0
          }
        })
        .eq("id", campaignId);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Conversion tracked successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Conversion tracking error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
