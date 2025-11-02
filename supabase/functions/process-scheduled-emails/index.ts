import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all scheduled emails that are due
    const { data: scheduledEmails, error: fetchError } = await supabaseClient
      .from("scheduled_emails")
      .select("*")
      .lte("scheduled_for", new Date().toISOString())
      .eq("sent", false)
      .limit(50);

    if (fetchError) throw fetchError;

    console.log(`Processing ${scheduledEmails?.length || 0} scheduled emails`);

    for (const email of scheduledEmails || []) {
      try {
        if (email.email_type === "community_unlock") {
          // Send community unlock email
          const response = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-community-unlock-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
              },
              body: JSON.stringify({
                email: email.email_data.email,
                firstName: email.email_data.firstName,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to send email: ${await response.text()}`);
          }
        }

        // Mark as sent
        await supabaseClient
          .from("scheduled_emails")
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq("id", email.id);

        console.log(`Sent scheduled email ${email.id} to ${email.email_data.email}`);
      } catch (emailError) {
        console.error(`Failed to send email ${email.id}:`, emailError);
        // Continue processing other emails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: scheduledEmails?.length || 0 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in process-scheduled-emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
