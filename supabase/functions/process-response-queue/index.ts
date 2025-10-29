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

    console.log("🔄 Processing response queue...");

    // Get all messages that are due to be sent
    const { data: dueMessages, error: fetchError } = await supabase
      .from("response_queue")
      .select("*")
      .eq("status", "queued")
      .lte("scheduled_send_time", new Date().toISOString())
      .order("scheduled_send_time", { ascending: true })
      .limit(50); // Process up to 50 messages per run

    if (fetchError) {
      console.error("Error fetching due messages:", fetchError);
      throw fetchError;
    }

    if (!dueMessages || dueMessages.length === 0) {
      console.log("✅ No messages due to be sent");
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📨 Found ${dueMessages.length} messages to send`);

    let successCount = 0;
    let errorCount = 0;

    // Process each message
    for (const msg of dueMessages) {
      try {
        const now = new Date().toISOString();
        const delayMinutes = Math.round(
          (new Date(now).getTime() - new Date(msg.created_at).getTime()) / (1000 * 60)
        );

        // Send the message by inserting into events table
        const { error: eventError } = await supabase
          .from("events")
          .insert({
            member_id: msg.user_id,
            type: "agent_interaction",
            meta: {
              event_type: "agent_message",
              message: msg.message_content,
              response_category: msg.response_category,
              priority: msg.priority,
              scheduled_for: msg.scheduled_send_time,
              actual_send_time: now,
              delay_minutes: delayMinutes,
              timestamp: now
            }
          });

        if (eventError) {
          console.error(`❌ Error sending message ${msg.id}:`, eventError);
          errorCount++;
          continue;
        }

        // Log to agent_interactions table
        await supabase
          .from("agent_interactions")
          .insert({
            user_id: msg.user_id,
            trigger_type: "scheduled_response",
            agent_response: msg.message_content,
            response_delay_minutes: delayMinutes,
            sent_at: now
          });

        // Update message status to sent
        const { error: updateError } = await supabase
          .from("response_queue")
          .update({
            status: "sent",
            actual_send_time: now
          })
          .eq("id", msg.id);

        if (updateError) {
          console.error(`⚠️ Error updating message status ${msg.id}:`, updateError);
        }

        console.log(`✅ Sent message ${msg.id} to user ${msg.user_id} (${delayMinutes}min delay)`);
        successCount++;

      } catch (msgError: any) {
        console.error(`❌ Failed to process message ${msg.id}:`, msgError);
        errorCount++;
      }
    }

    console.log(`✅ Processing complete: ${successCount} sent, ${errorCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: successCount,
        failed: errorCount,
        total: dueMessages.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in process-response-queue:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
