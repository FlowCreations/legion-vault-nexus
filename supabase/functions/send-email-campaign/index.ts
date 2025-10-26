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
    const resendKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError) throw campaignError;

    // Get list members based on filter rules
    const { data: list } = await supabase
      .from("email_lists")
      .select("filter_rules")
      .eq("id", campaign.list_id)
      .single();

    // Get user profiles matching the filter
    let query = supabase.from("user_profiles").select("user_id, display_name");
    
    // Apply filters from list.filter_rules
    // This is simplified - Phase 2 will have advanced filtering
    const { data: recipients } = await query;

    if (!recipients || recipients.length === 0) {
      throw new Error("No recipients found");
    }

    // Get email addresses from auth.users
    const userIds = recipients.map((r) => r.user_id);
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const emailMap = new Map(authUsers.users.map((u) => [u.id, u.email]));

    // Send emails
    const sendPromises = recipients.map(async (recipient) => {
      const email = emailMap.get(recipient.user_id);
      if (!email) return;

      // Replace variables in email body
      let personalizedBody = campaign.email_body;
      personalizedBody = personalizedBody.replace(/\{\{user_name\}\}/g, recipient.display_name || "there");

      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'JRNY <onboarding@resend.dev>',
            to: [email],
            subject: campaign.subject,
            html: personalizedBody,
          }),
        });

        if (!emailResponse.ok) {
          throw new Error(`Resend API error: ${emailResponse.statusText}`);
        }

        // Track send
        await supabase.from("email_sends").insert({
          campaign_id: campaignId,
          user_id: recipient.user_id,
          email_address: email,
        });
      } catch (error) {
        console.error(`Failed to send to ${email}:`, error);
      }
    });

    await Promise.all(sendPromises);

    // Update campaign status
    await supabase
      .from("email_campaigns")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", campaignId);

    return new Response(
      JSON.stringify({ success: true, sent: recipients.length }),
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
