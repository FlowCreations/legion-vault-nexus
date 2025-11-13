import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    
    const messageSid = formData.get("MessageSid") as string;
    const messageStatus = formData.get("MessageStatus") as string;
    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Update SMS delivery status
    if (messageSid && messageStatus) {
      const updateData: any = { status: messageStatus };
      
      if (messageStatus === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      }

      await supabase
        .from("sms_sends")
        .update(updateData)
        .eq("twilio_message_sid", messageSid);
    }

    // Handle opt-out keywords (STOP, UNSUBSCRIBE, etc.)
    if (body && from) {
      const optOutKeywords = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"];
      const normalizedBody = body.trim().toUpperCase();
      
      if (optOutKeywords.includes(normalizedBody)) {
        // Find user by phone number and opt them out
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("phone_number", from)
          .limit(1);

        if (profiles && profiles.length > 0) {
          await supabase
            .from("user_profiles")
            .update({
              sms_opt_in: false,
              sms_opted_out_at: new Date().toISOString(),
            })
            .eq("id", profiles[0].id);

          console.log(`User ${profiles[0].id} opted out of SMS via ${normalizedBody}`);
        }

        // Send confirmation (required by TCPA)
        const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
        const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
        const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

        if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
          const confirmFormData = new URLSearchParams();
          confirmFormData.append("To", from);
          confirmFormData.append("From", twilioPhoneNumber);
          confirmFormData.append("Body", "You have been unsubscribed from SMS messages. Reply START to opt back in.");

          await fetch(twilioUrl, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: confirmFormData,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in twilio-webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
