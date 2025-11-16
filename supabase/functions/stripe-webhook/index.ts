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

  // Initialize Supabase client at the top
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

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

      // Handle subscription checkout
      if (session.mode === "subscription") {
        const customerEmail = session.customer_details?.email;
        const customerId = session.customer as string;
        
        if (!customerEmail) {
          console.error("No customer email in subscription session");
          return new Response(JSON.stringify({ error: "No customer email" }), { status: 400 });
        }

        // Get subscription details
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['items.data.price.product']
        });

        const priceItem = subscription.items.data[0];
        const product = priceItem.price.product as Stripe.Product;
        
        // Update user profile with subscription data
        const { data: userData } = await supabase.auth.admin.listUsers();
        const user = userData.users.find(u => u.email === customerEmail);

        if (user) {
          // Determine membership tier from product name
          let membershipTier = 'free';
          const productNameLower = product.name.toLowerCase();
          if (productNameLower.includes('rebel')) {
            membershipTier = 'rebel';
          } else if (productNameLower.includes('outlaw')) {
            membershipTier = 'outlaw';
          } else if (productNameLower.includes('legionnaire')) {
            membershipTier = 'legionnaire';
          }

          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              subscription_status: subscription.status,
              subscription_plan: product.name,
              subscription_id: subscription.id,
              stripe_customer_id: customerId,
              membership_tier: membershipTier,
              trial_end_date: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
              billing_cycle_anchor: new Date(subscription.current_period_end * 1000).toISOString(),
              subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('user_id', user.id);

          if (updateError) {
            console.error("Error updating user profile:", updateError);
          } else {
            console.log("User profile updated with subscription data and tier:", membershipTier);
          }

          // Send subscription created email
          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('email, first_name, display_name')
              .eq('user_id', user.id)
              .single();

            if (profile?.email) {
              await supabase.functions.invoke('send-subscription-emails', {
                body: {
                  email: profile.email,
                  firstName: profile.first_name || profile.display_name || 'Member',
                  eventType: 'subscription_created',
                  planName: product.name,
                  amount: session.amount_total,
                  nextBillingDate: new Date(subscription.current_period_end * 1000).toISOString()
                }
              });
              console.log('Subscription created email sent to:', profile.email);
            }
          } catch (emailError) {
            console.error('Error sending subscription created email:', emailError);
          }
        }

        // Send admin notification email
        try {
          await supabase.functions.invoke('send-subscription-admin-notification', {
            body: {
              userEmail: customerEmail,
              userName: session.customer_details?.name || customerEmail,
              planName: product.name,
              amount: priceItem.price.unit_amount! / 100,
              currency: priceItem.price.currency,
              subscriptionId: subscription.id,
              trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : undefined,
            }
          });
          console.log("Admin notification sent");
        } catch (emailError) {
          console.error("Error sending admin notification:", emailError);
        }

        // Send user confirmation email
        try {
          const firstName = session.customer_details?.name?.split(' ')[0] || 'there';
          await supabase.functions.invoke('send-subscription-confirmation', {
            body: {
              email: customerEmail,
              firstName,
              planName: product.name,
              amount: priceItem.price.unit_amount! / 100,
              currency: priceItem.price.currency,
              interval: priceItem.price.recurring?.interval || 'month',
              trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : undefined,
              nextBillingDate: new Date(subscription.current_period_end * 1000).toISOString(),
            }
          });
          console.log("User confirmation email sent");
        } catch (emailError) {
          console.error("Error sending confirmation email:", emailError);
        }

        return new Response(JSON.stringify({ received: true, subscription_processed: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // For one-time payments (albums, etc) - supabase client already initialized at top

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

    // Handle customer.subscription.updated event (plan changes)
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("Processing subscription update:", subscription.id);

      // Get customer details
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      const customerEmail = (customer as Stripe.Customer).email;

      if (!customerEmail) {
        console.error("No customer email found");
        return new Response(JSON.stringify({ error: "No customer email" }), { status: 400 });
      }

      // Get user by email
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData.users.find(u => u.email === customerEmail);

      if (user) {
        // Get product details
        const priceItem = subscription.items.data[0];
        const product = await stripe.products.retrieve(
          typeof priceItem.price.product === 'string' 
            ? priceItem.price.product 
            : priceItem.price.product.id
        );

        // Determine membership tier
        let membershipTier = 'free';
        const productNameLower = product.name.toLowerCase();
        if (productNameLower.includes('rebel')) {
          membershipTier = 'rebel';
        } else if (productNameLower.includes('outlaw')) {
          membershipTier = 'outlaw';
        } else if (productNameLower.includes('legionnaire')) {
          membershipTier = 'legionnaire';
        }

        // Update user profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            subscription_status: subscription.status,
            subscription_plan: product.name,
            membership_tier: membershipTier,
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error("Error updating user profile on subscription update:", updateError);
        } else {
          console.log("User profile updated on subscription change");
        }
      }

      const previousAttributes = event.data.previous_attributes as any;
      
      // Check if items changed (indicating a plan change)
      if (previousAttributes?.items?.data && previousAttributes.items.data.length > 0) {
        console.log("Processing subscription plan change:", subscription.id);

        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const customerEmail = customer.email;
        const customerName = customer.name || customer.email?.split('@')[0] || "Member";

        // Get current plan details
        const currentItem = subscription.items.data[0];
        const newPlanName = currentItem.price.nickname || "New Plan";
        const newAmount = currentItem.price.unit_amount || 0;
        const currency = subscription.currency || "usd";
        const billingInterval = currentItem.price.recurring?.interval || "month";
        const effectiveDate = new Date(subscription.current_period_start * 1000).toISOString();
        const nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();

        // Get old plan details from previous attributes
        const previousItem = previousAttributes.items.data[0];
        const oldPlanName = previousItem.price?.nickname || "Previous Plan";
        const oldAmount = previousItem.price?.unit_amount || 0;

        // Determine if it's an upgrade or downgrade based on price
        const changeType = newAmount > oldAmount ? "upgrade" : "downgrade";

        console.log("Plan change detected:", { oldPlanName, newPlanName, oldAmount, newAmount, changeType });

        // Send plan change confirmation email
        const { error: emailError } = await supabase.functions.invoke("send-plan-change-confirmation", {
          body: {
            email: customerEmail,
            customerName: customerName,
            oldPlanName: oldPlanName,
            newPlanName: newPlanName,
            changeType: changeType,
            newAmount: newAmount,
            currency: currency,
            billingInterval: billingInterval,
            effectiveDate: effectiveDate,
            nextBillingDate: nextBillingDate,
          },
        });

        if (emailError) {
          console.error("Error sending plan change confirmation email:", emailError);
        } else {
          console.log("Plan change confirmation email triggered for:", customerEmail);
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle customer.subscription.deleted event (cancellation)
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      
      console.log("Processing subscription cancellation:", subscription.id);

      // Get customer details
      const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
      const customerEmail = customer.email;
      const customerName = customer.name || customer.email?.split('@')[0] || "Member";
      
      if (!customerEmail) {
        console.error("No customer email found for subscription cancellation");
        return new Response(JSON.stringify({ error: "No customer email" }), { status: 400 });
      }

      // Update user profile - reset to free tier
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData.users.find(u => u.email === customerEmail);

      if (user) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            subscription_status: 'cancelled',
            membership_tier: 'free',
            subscription_plan: null,
            subscription_id: null,
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error("Error updating user profile on cancellation:", updateError);
        } else {
          console.log("User profile updated to free tier on subscription cancellation");
        }
      }

      // Get plan details
      const planName = subscription.items.data[0].price.nickname || "Membership";
      const cancelledAt = new Date(subscription.canceled_at! * 1000).toISOString();
      const accessUntil = new Date(subscription.current_period_end * 1000).toISOString();

      // Send cancellation confirmation email
      const { error: emailError } = await supabase.functions.invoke("send-cancellation-confirmation", {
        body: {
          email: customerEmail,
          customerName: customerName,
          planName: planName,
          cancelledAt: cancelledAt,
          accessUntil: accessUntil,
          cancellationReason: subscription.cancellation_details?.reason || undefined,
        },
      });

      if (emailError) {
        console.error("Error sending cancellation confirmation email:", emailError);
      } else {
        console.log("Cancellation confirmation email triggered for:", customerEmail);
      }

      return new Response(JSON.stringify({ received: true }), {
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
