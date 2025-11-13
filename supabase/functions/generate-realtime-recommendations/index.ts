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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all user profiles with PTP/ERA scores
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("user_id, ptp_score, era_label, total_spend, watch_time, listen_time, last_active_at")
      .not("user_id", "is", null);

    if (profilesError) throw profilesError;

    const recommendations = [];

    for (const profile of profiles || []) {
      const ptpScore = profile.ptp_score || 0;
      const eraLabel = profile.era_label || "Discover";
      const totalSpend = profile.total_spend || 0;
      const watchTime = profile.watch_time || 0;
      const listenTime = profile.listen_time || 0;
      const lastActive = profile.last_active_at ? new Date(profile.last_active_at) : null;
      const daysSinceActive = lastActive 
        ? Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // High PTP Score - Ready to Buy
      if (ptpScore >= 67 && totalSpend === 0) {
        recommendations.push({
          user_id: profile.user_id,
          recommendation_type: "discount_offer",
          title: "🎯 Hot Lead Ready to Convert",
          description: `High PTP score (${ptpScore}) with no purchases. Send exclusive discount to convert.`,
          suggested_action: {
            campaign_type: "discount_offer",
            discount_percentage: 15,
            urgency: "24-hour limited offer",
            subject: "Your Exclusive 15% Off - Today Only!",
          },
          confidence_score: 0.85,
          ptp_score: ptpScore,
          era_label: eraLabel,
          behavioral_triggers: ["high_ptp", "no_purchase"],
        });
      }

      // Engaged but Not Invested
      if (eraLabel === "Engage" && (watchTime > 30 || listenTime > 30) && totalSpend === 0) {
        recommendations.push({
          user_id: profile.user_id,
          recommendation_type: "content_suggestion",
          title: "🎵 Engaged Fan - Convert to Buyer",
          description: `Active consumer (${Math.floor((watchTime + listenTime) / 60)}h content). Send merch/album offer.`,
          suggested_action: {
            campaign_type: "product_showcase",
            products: ["limited_edition_merch", "signed_album"],
            subject: "You've Been Rockin' With Us - Get Something Special",
          },
          confidence_score: 0.72,
          ptp_score: ptpScore,
          era_label: eraLabel,
          behavioral_triggers: ["high_engagement", "no_purchase"],
        });
      }

      // Inactive Re-engagement
      if (daysSinceActive > 30 && totalSpend > 0) {
        recommendations.push({
          user_id: profile.user_id,
          recommendation_type: "re_engagement",
          title: "🔄 Win Back Previous Customer",
          description: `Inactive for ${daysSinceActive} days. Previous buyer ($${totalSpend}). Re-engage with exclusive content.`,
          suggested_action: {
            campaign_type: "winback",
            offer_type: "exclusive_content",
            subject: "We Miss You! Here's Something Special...",
          },
          confidence_score: 0.65,
          ptp_score: ptpScore,
          era_label: eraLabel,
          behavioral_triggers: ["inactive", "previous_buyer"],
        });
      }

      // VIP Upgrade Opportunity
      if (ptpScore >= 80 && eraLabel === "Invest" && totalSpend > 50) {
        recommendations.push({
          user_id: profile.user_id,
          recommendation_type: "vip_upgrade",
          title: "⭐ VIP Upgrade Candidate",
          description: `Top fan (PTP ${ptpScore}, $${totalSpend} spent). Offer exclusive VIP membership/experience.`,
          suggested_action: {
            campaign_type: "vip_offer",
            tier: "Legionnaire",
            benefits: ["backstage_access", "early_releases", "exclusive_merch"],
            subject: "You're Invited: Join Our VIP Circle",
          },
          confidence_score: 0.90,
          ptp_score: ptpScore,
          era_label: eraLabel,
          behavioral_triggers: ["high_ptp", "high_spend", "loyal"],
        });
      }

      // Abandoned Cart Check
      const { data: abandonedCarts } = await supabase
        .from("abandoned_carts")
        .select("*")
        .eq("user_id", profile.user_id)
        .eq("status", "pending")
        .single();

      if (abandonedCarts) {
        recommendations.push({
          user_id: profile.user_id,
          recommendation_type: "discount_offer",
          title: "🛒 Abandoned Cart Recovery",
          description: `Cart value: $${abandonedCarts.cart_value}. Send recovery email with discount.`,
          suggested_action: {
            campaign_type: "cart_recovery",
            discount_code: abandonedCarts.discount_code,
            cart_items: abandonedCarts.cart_items,
            subject: `Don't Miss Out! Your Cart is Waiting (${abandonedCarts.discount_percentage}% Off)`,
          },
          confidence_score: 0.78,
          ptp_score: ptpScore,
          era_label: eraLabel,
          behavioral_triggers: ["abandoned_cart"],
        });
      }
    }

    // Insert recommendations into ai_email_insights instead
    if (recommendations.length > 0) {
      const insights = recommendations.map(rec => ({
        insight_title: rec.title,
        insight_description: rec.description,
        confidence_score: rec.confidence_score,
        insight_data: rec.suggested_action,
      }));

      const { error: insertError } = await supabase
        .from("ai_email_insights")
        .insert(insights);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        generated: recommendations.length,
        message: `Generated ${recommendations.length} email recommendations` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});