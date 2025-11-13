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

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError) throw campaignError;

    // Get list members with filtering
    const { data: list, error: listError } = await supabase
      .from("email_lists")
      .select("filter_rules")
      .eq("id", campaign.list_id)
      .single();

    if (listError) throw listError;

    // Get subscribers based on filter rules
    let query = supabase
      .from("user_profiles")
      .select("user_id, display_name, ptp_score, era_label, total_spend, favorite_track, city, state");

    // Apply filters from list
    const filters = list.filter_rules || {};
    if (filters.min_ptp_score) {
      query = query.gte("ptp_score", filters.min_ptp_score);
    }
    if (filters.era_labels && filters.era_labels.length > 0) {
      query = query.in("era_label", filters.era_labels);
    }
    if (filters.min_total_spend) {
      query = query.gte("total_spend", filters.min_total_spend);
    }

    const { data: profiles, error: profilesError } = await query;
    if (profilesError) throw profilesError;

    // Get email addresses from auth.users
    const userIds = profiles?.map(p => p.user_id) || [];
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    const emailMap = new Map();
    authUsers.users.forEach(user => {
      emailMap.set(user.id, user.email);
    });

    // Send emails via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    let sentCount = 0;
    const sends = [];

    for (const profile of profiles || []) {
      const email = emailMap.get(profile.user_id);
      if (!email) continue;

      // Personalize email body
      let personalizedBody = campaign.email_body
        .replace(/\{\{user_name\}\}/g, profile.display_name || "there")
        .replace(/\{\{first_name\}\}/g, (profile.display_name || "there").split(" ")[0])
        .replace(/\{\{ptp_score\}\}/g, profile.ptp_score?.toString() || "0")
        .replace(/\{\{era_label\}\}/g, profile.era_label || "New Fan")
        .replace(/\{\{total_spend\}\}/g, `$${(profile.total_spend || 0).toFixed(2)}`)
        .replace(/\{\{favorite_track\}\}/g, profile.favorite_track || "your favorite track")
        .replace(/\{\{city\}\}/g, profile.city || "")
        .replace(/\{\{state\}\}/g, profile.state || "");

      // Send via Resend
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Sons of Legion <noreply@sonsoflegion.com>",
          to: [email],
          subject: campaign.subject,
          html: personalizedBody,
        }),
      });

      if (resendResponse.ok) {
        const resendData = await resendResponse.json();
        sends.push({
          campaign_id: campaignId,
          user_id: profile.user_id,
          email_address: email,
          sent_at: new Date().toISOString(),
          provider_message_id: resendData.id,
        });
        sentCount++;
      }
    }

    // Track sends
    if (sends.length > 0) {
      await supabase.from("email_sends").insert(sends);
    }

    // Update campaign status
    await supabase
      .from("email_campaigns")
      .update({ 
        status: "sent", 
        sent_at: new Date().toISOString() 
      })
      .eq("id", campaignId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        message: `Campaign sent to ${sentCount} recipients` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending campaign:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});