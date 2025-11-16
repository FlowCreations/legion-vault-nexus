import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { priceId, embedded } = await req.json();
    if (!priceId) throw new Error("Price ID is required");
    logStep("Price ID received", { priceId, embedded });

    // Try to get authenticated user, but allow guest checkout
    const authHeader = req.headers.get("Authorization");
    let user = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      user = userData.user;
      if (user?.email) {
        logStep("User authenticated", { userId: user.id, email: user.email });
      }
    }
    
    if (!user) {
      logStep("Guest checkout - user will enter email in Stripe");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check if customer exists (only if user is authenticated)
    let customerId;
    if (user?.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing customer", { customerId });
      } else {
        logStep("No existing customer found");
      }
    } else {
      logStep("Guest checkout - no customer lookup needed");
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Create checkout session with 7-day free trial
    const sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : (user?.email || undefined),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 7,
      },
      allow_promotion_codes: true,
    };

    // Configure for embedded or hosted checkout
    if (embedded) {
      sessionConfig.ui_mode = "embedded";
      sessionConfig.return_url = `${origin}/subscribe?session_id={CHECKOUT_SESSION_ID}`;
    } else {
      sessionConfig.success_url = `${origin}/profile?subscription=success`;
      sessionConfig.cancel_url = `${origin}/subscribe?canceled=true`;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Checkout session created", { sessionId: session.id, embedded });

    // Return client secret for embedded or URL for hosted
    if (embedded) {
      return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
