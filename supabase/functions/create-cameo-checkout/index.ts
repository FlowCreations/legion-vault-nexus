import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { recipientName, occasionType, specialInstructions, deliveryDate, email } = await req.json();

    if (!recipientName || !occasionType || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get authenticated user (optional - can be guest)
    let userId = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      userId = data.user?.id;
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check for existing customer
    let customerId;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    // Create cameo request in database
    const { data: cameoRequest, error: dbError } = await supabaseClient
      .from('cameo_requests')
      .insert({
        requester_user_id: userId,
        requester_email: email,
        recipient_name: recipientName,
        occasion_type: occasionType,
        special_instructions: specialInstructions,
        requested_delivery_date: deliveryDate,
        price_paid: 100,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Created cameo request:', cameoRequest.id);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Personalized Cameo Video',
              description: `For ${recipientName} - ${occasionType}`,
            },
            unit_amount: 10000, // $100 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/community?tab=cameos&success=true`,
      cancel_url: `${req.headers.get("origin")}/community?tab=cameos&cancelled=true`,
      metadata: {
        cameo_request_id: cameoRequest.id,
      },
    });

    // Update request with session ID
    await supabaseClient
      .from('cameo_requests')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', cameoRequest.id);

    console.log('Created checkout session:', session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
