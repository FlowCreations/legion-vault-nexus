import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is admin - admins get full access without subscription
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleData) {
      logStep("Admin user detected - granting full access", { email: user.email });
      return new Response(JSON.stringify({
        subscribed: true,
        is_admin: true,
        subscription: {
          plan_name: "Admin Access",
          status: "active"
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        customer: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customer = customers.data[0];
    const customerId = customer.id;
    logStep("Found Stripe customer", { customerId });

    // Get subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
      expand: ['data.items.data.price']
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionData = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      const priceItem = subscription.items.data[0];
      const productId = typeof priceItem.price.product === 'string' 
        ? priceItem.price.product 
        : priceItem.price.product.id;
      
      // Fetch product details separately to avoid expansion depth limit
      const product = await stripe.products.retrieve(productId);
      
      subscriptionData = {
        id: subscription.id,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        plan_name: product.name,
        plan_description: product.description,
        amount: priceItem.price.unit_amount! / 100,
        currency: priceItem.price.currency,
        interval: priceItem.price.recurring?.interval,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      };

      // Update user profile with latest subscription data
      const { data: userData } = await supabaseClient.auth.getUser(token);
      if (userData.user) {
        await supabaseClient
          .from('user_profiles')
          .update({
            subscription_status: subscription.status,
            subscription_plan: product.name,
            subscription_id: subscription.id,
            stripe_customer_id: customerId,
            trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            billing_cycle_anchor: new Date(subscription.current_period_end * 1000).toISOString(),
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('user_id', userData.user.id);
      }
      
      logStep("Active subscription found", { subscriptionId: subscription.id, plan: product.name });
    } else {
      logStep("No active subscription found");
    }

    // Get payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
      limit: 1,
    });

    let paymentMethod = null;
    if (paymentMethods.data.length > 0) {
      const pm = paymentMethods.data[0];
      paymentMethod = {
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        exp_month: pm.card?.exp_month,
        exp_year: pm.card?.exp_year,
      };
      logStep("Payment method found", { last4: pm.card?.last4 });
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription: subscriptionData,
      payment_method: paymentMethod,
      customer: {
        id: customer.id,
        email: customer.email,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
