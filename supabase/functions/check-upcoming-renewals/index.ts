import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    console.log("Starting upcoming renewals check...");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate date 3 days from now (with some buffer)
    const threeDaysFromNow = Math.floor(Date.now() / 1000) + (3 * 24 * 60 * 60);
    const threeDaysBuffer = threeDaysFromNow + (2 * 60 * 60); // 2 hour buffer

    console.log("Checking for subscriptions renewing around:", new Date(threeDaysFromNow * 1000).toISOString());

    // Get all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
    });

    console.log(`Found ${subscriptions.data.length} active subscriptions`);

    let remindersSent = 0;
    const errors: string[] = [];

    for (const subscription of subscriptions.data) {
      const renewalTime = subscription.current_period_end;
      
      // Check if renewal is approximately 3 days away
      if (renewalTime >= threeDaysFromNow && renewalTime <= threeDaysBuffer) {
        console.log(`Subscription ${subscription.id} renews on ${new Date(renewalTime * 1000).toISOString()}`);

        // Get customer details
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ('email' in customer && customer.email) {
          const customerEmail = customer.email;
          const customerName = 'name' in customer ? customer.name : undefined;
          const planName = subscription.items.data[0].price.nickname || "Premium Membership";
          const amountTotal = subscription.items.data[0].price.unit_amount || 0;
          const currency = subscription.items.data[0].price.currency;

          console.log(`Sending renewal reminder to: ${customerEmail}`);

          // Check if we already sent a reminder for this renewal period
          const reminderKey = `${subscription.id}-${renewalTime}`;
          const { data: existingLog } = await supabase
            .from("email_logs")
            .select("id")
            .eq("email_type", "renewal_reminder")
            .eq("recipient_email", customerEmail)
            .eq("user_id", reminderKey)
            .single();

          if (existingLog) {
            console.log(`Reminder already sent for ${customerEmail} - skipping`);
            continue;
          }

          // Send renewal reminder email
          const { error: emailError } = await supabase.functions.invoke("send-renewal-reminder", {
            body: {
              email: customerEmail,
              customerName: customerName,
              planName: planName,
              amountTotal: amountTotal,
              currency: currency,
              renewalDate: renewalTime,
              subscriptionId: subscription.id,
            },
          });

          if (emailError) {
            console.error(`Error sending reminder to ${customerEmail}:`, emailError);
            errors.push(`${customerEmail}: ${emailError.message}`);
          } else {
            // Log the email send
            await supabase.from("email_logs").insert({
              email_type: "renewal_reminder",
              recipient_email: customerEmail,
              user_id: reminderKey,
              status: "sent",
              sent_at: new Date().toISOString(),
            });

            remindersSent++;
            console.log(`Renewal reminder sent to: ${customerEmail}`);
          }
        } else {
          console.log(`Subscription ${subscription.id} has no customer email - skipping`);
        }
      }
    }

    const summary = {
      checked: subscriptions.data.length,
      remindersSent: remindersSent,
      errors: errors.length,
      errorDetails: errors,
      timestamp: new Date().toISOString(),
    };

    console.log("Renewal check completed:", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in check-upcoming-renewals:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
