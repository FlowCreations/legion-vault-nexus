import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Server-side price catalog - SINGLE SOURCE OF TRUTH
const GALLERY_ITEMS: Record<string, { title: string; price: number }> = {
  'show-1': { title: 'The Midnight Session', price: 54.99 },
  'show-2': { title: 'Electric Dreams Tour', price: 64.99 },
  'show-3': { title: 'Sunset Acoustics', price: 44.99 },
};

// Helper to validate item ID and get server price
function validateAndGetPrice(itemId: string): { valid: boolean; price?: number; title?: string; error?: string } {
  const item = GALLERY_ITEMS[itemId];
  if (!item) {
    return { valid: false, error: 'Invalid item ID' };
  }
  return { valid: true, price: item.price, title: item.title };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const { itemId, clientPrice } = await req.json();

    if (!itemId || typeof itemId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Item ID is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CRITICAL: Validate item and get server-side price
    const validation = validateAndGetPrice(itemId);
    if (!validation.valid) {
      console.error('Invalid item ID attempted:', itemId);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CRITICAL: Detect price manipulation attempts
    if (clientPrice !== undefined && Math.abs(clientPrice - validation.price!) > 0.01) {
      console.error('Price manipulation attempt detected:', {
        itemId,
        clientPrice,
        serverPrice: validation.price,
      });
      return new Response(
        JSON.stringify({ error: 'Price validation failed' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get user email if authenticated
    let customerEmail = undefined;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabaseClient.auth.getUser(token);
        if (data.user?.email) {
          customerEmail = data.user.email;
        }
      } catch (error) {
        console.log("No authenticated user, proceeding with guest checkout");
      }
    }

    // Create checkout session with SERVER-VALIDATED price
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: validation.title!,
            },
            unit_amount: Math.round(validation.price! * 100), // Server price only!
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/shows/gallery?success=true`,
      cancel_url: `${req.headers.get("origin")}/shows/gallery?canceled=true`,
      metadata: {
        itemId: itemId,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
