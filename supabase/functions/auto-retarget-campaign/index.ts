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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("Starting auto-retargeting process...");

    // Find active campaigns within their retargeting window
    const { data: campaigns, error: campaignsError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("status", "sent")
      .gte("sent_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (campaignsError) throw campaignsError;

    let totalSequencesCreated = 0;

    for (const campaign of campaigns || []) {
      const campaignId = campaign.id;
      const daysSinceSent = Math.floor((Date.now() - new Date(campaign.sent_at).getTime()) / (24 * 60 * 60 * 1000));

      console.log(`Processing campaign ${campaignId}, day ${daysSinceSent}`);

      // Get all sends for this campaign
      const { data: sends } = await supabase
        .from("email_sends")
        .select("*")
        .eq("campaign_id", campaignId);

      if (!sends || sends.length === 0) continue;

      // Get suppressions
      const { data: suppressions } = await supabase
        .from("email_campaign_suppressions")
        .select("user_id")
        .eq("campaign_id", campaignId);

      const suppressedUserIds = new Set(suppressions?.map(s => s.user_id) || []);

      // Segment users
      const notOpened = sends.filter(s => 
        !s.opened_at && 
        !suppressedUserIds.has(s.user_id) &&
        (s.send_sequence_number || 1) < (campaign.max_sends_per_user || 3)
      );

      const openedNotClicked = sends.filter(s => 
        s.opened_at && 
        !s.clicked_at && 
        !suppressedUserIds.has(s.user_id) &&
        (s.send_sequence_number || 1) < (campaign.max_sends_per_user || 3)
      );

      const clickedNotPurchased = sends.filter(s => 
        s.clicked_at && 
        !s.purchased_at && 
        !suppressedUserIds.has(s.user_id) &&
        (s.send_sequence_number || 1) < (campaign.max_sends_per_user || 3)
      );

      // Schedule Send #2 on Day 3
      if (daysSinceSent === 3) {
        // Generate AI subject lines for retargeting
        const { data: aiContent } = await supabase.functions.invoke("generate-email-content", {
          body: {
            campaignGoal: "retarget_not_opened",
            originalSubject: campaign.subject,
            targetAudience: "Users who haven't opened yet",
            tone: "urgent"
          }
        });

        const urgentSubject = aiContent?.subject || `Don't miss out: ${campaign.subject}`;

        // Create sequences for not opened
        if (notOpened.length > 0) {
          await supabase.from("email_campaign_sequences").insert({
            campaign_id: campaignId,
            sequence_number: 2,
            subject_line: urgentSubject,
            email_body: campaign.email_body,
            target_segment: "not_opened",
            scheduled_for: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
            status: "pending"
          });
          totalSequencesCreated++;
        }

        // Create sequences for opened but not clicked
        if (openedNotClicked.length > 0) {
          const { data: reminderContent } = await supabase.functions.invoke("generate-email-content", {
            body: {
              campaignGoal: "retarget_opened_not_clicked",
              originalSubject: campaign.subject,
              targetAudience: "Users who opened but didn't click",
              tone: "helpful"
            }
          });

          await supabase.from("email_campaign_sequences").insert({
            campaign_id: campaignId,
            sequence_number: 2,
            subject_line: reminderContent?.subject || `Reminder: ${campaign.subject}`,
            email_body: campaign.email_body,
            target_segment: "opened_not_clicked",
            scheduled_for: new Date(Date.now() + 60000).toISOString(),
            status: "pending"
          });
          totalSequencesCreated++;
        }
      }

      // Schedule Send #3 on Day 6
      if (daysSinceSent === 6) {
        if (clickedNotPurchased.length > 0) {
          const { data: finalContent } = await supabase.functions.invoke("generate-email-content", {
            body: {
              campaignGoal: "retarget_final_urgency",
              originalSubject: campaign.subject,
              targetAudience: "Users who clicked but didn't purchase",
              tone: "urgent"
            }
          });

          await supabase.from("email_campaign_sequences").insert({
            campaign_id: campaignId,
            sequence_number: 3,
            subject_line: finalContent?.subject || `Last chance: ${campaign.subject}`,
            email_body: campaign.email_body,
            target_segment: "clicked_not_purchased",
            scheduled_for: new Date(Date.now() + 60000).toISOString(),
            status: "pending"
          });
          totalSequencesCreated++;
        }
      }
    }

    console.log(`Auto-retargeting complete. Created ${totalSequencesCreated} sequences.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        campaignsProcessed: campaigns?.length || 0,
        sequencesCreated: totalSequencesCreated 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Auto-retargeting error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
