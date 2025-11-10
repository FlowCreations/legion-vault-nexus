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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("No stripe signature found");
      return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
    }

    const body = await req.text();
    
    // Verify webhook signature if secret is available
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event;
    
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
      }
    } else {
      console.warn("STRIPE_WEBHOOK_SECRET not set - skipping signature verification (not recommended for production)");
      event = JSON.parse(body);
    }

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Processing checkout session:", session.id);
      console.log("Session mode:", session.mode);

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Extract purchase details
      const customerEmail = session.customer_details?.email || session.metadata?.email;
      const customerName = session.customer_details?.name || session.metadata?.customer_name;
      const userId = session.metadata?.user_id || null;
      const productType = session.metadata?.product_type || "album";
      const productId = session.metadata?.product_id;
      const productName = session.metadata?.product_name || "Unknown Product";
      const amountTotal = session.amount_total || 0;
      const currency = session.currency || "usd";

      if (!customerEmail) {
        console.error("No customer email found in session");
        return new Response(JSON.stringify({ error: "No customer email" }), { status: 400 });
      }

      // Check if purchase already exists (idempotency)
      const { data: existingPurchase } = await supabase
        .from("purchases")
        .select("id")
        .eq("stripe_session_id", session.id)
        .single();

      if (existingPurchase) {
        console.log("Purchase already recorded:", session.id);
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Insert purchase record
      const { data: purchase, error: insertError } = await supabase
        .from("purchases")
        .insert({
          user_id: userId,
          email: customerEmail,
          customer_name: customerName,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          product_type: productType,
          product_id: productId,
          product_name: productName,
          amount_total: amountTotal,
          currency: currency,
          status: "completed",
          metadata: {
            session_metadata: session.metadata,
            customer_details: session.customer_details,
          },
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting purchase:", insertError);
        throw insertError;
      }

      console.log("Purchase recorded:", purchase.id);

      // Trigger appropriate email based on session mode
      if (session.mode === "subscription") {
        // Handle subscription - get subscription details
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        const { error: emailError } = await supabase.functions.invoke("send-subscription-welcome", {
          body: {
            email: customerEmail,
            customerName: customerName,
            subscriptionId: subscriptionId,
            planName: subscription.items.data[0].price.nickname || "Premium Membership",
            amountTotal: amountTotal,
            currency: currency,
            billingInterval: subscription.items.data[0].price.recurring?.interval || "month",
            currentPeriodEnd: subscription.current_period_end,
            orderNumber: session.id.slice(-8).toUpperCase(),
          },
        });

        if (emailError) {
          console.error("Error sending subscription welcome email:", emailError);
        } else {
          console.log("Subscription welcome email triggered for:", customerEmail);
        }
      } else {
        // Handle one-time purchase
        const { error: emailError } = await supabase.functions.invoke("send-purchase-confirmation", {
          body: {
            purchaseId: purchase.id,
            email: customerEmail,
            customerName: customerName,
            productName: productName,
            productType: productType,
            productId: productId,
            amountTotal: amountTotal,
            currency: currency,
            orderNumber: session.id.slice(-8).toUpperCase(),
          },
        });

        if (emailError) {
          console.error("Error sending confirmation email:", emailError);
        } else {
          console.log("Confirmation email triggered for:", customerEmail);
        }
      }

      return new Response(JSON.stringify({ received: true, purchaseId: purchase.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Return success for other event types
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
