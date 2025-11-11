import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if feature is enabled
    const { data: featureFlag } = await supabaseClient
      .from('feature_flags')
      .select('enabled')
      .eq('flag_name', 'abandoned_cart_recovery_enabled')
      .single()

    if (!featureFlag?.enabled) {
      return new Response(
        JSON.stringify({ message: 'Abandoned cart recovery is disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find carts abandoned for 3+ days with no purchase
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    
    const { data: abandonedSessions } = await supabaseClient
      .from('cart_sessions')
      .select('*')
      .lt('last_updated', threeDaysAgo.toISOString())
      .gte('cart_value', 20) // Minimum $20 cart value

    if (!abandonedSessions || abandonedSessions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No abandoned carts found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = []

    for (const session of abandonedSessions) {
      // Check if already tracked
      const { data: existing } = await supabaseClient
        .from('abandoned_carts')
        .select('id')
        .eq('user_id', session.user_id)
        .eq('status', 'pending')
        .single()

      if (existing) continue

      // Create discount code
      const discountResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/create-shopify-discount`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({
            percentage: 25,
            userId: session.user_id,
          }),
        }
      )

      if (!discountResponse.ok) {
        console.error('Failed to create discount for user:', session.user_id)
        continue
      }

      const discountData = await discountResponse.json()

      // Create abandoned cart record
      const { data: abandonedCart } = await supabaseClient
        .from('abandoned_carts')
        .insert({
          user_id: session.user_id,
          cart_items: session.cart_items,
          cart_value: session.cart_value,
          discount_code: discountData.code,
          discount_percentage: 25,
          expires_at: discountData.expiresAt,
        })
        .select()
        .single()

      if (abandonedCart) {
        // Save discount code details
        await supabaseClient
          .from('shopify_discount_codes')
          .insert({
            code: discountData.code,
            discount_percentage: 25,
            abandoned_cart_id: abandonedCart.id,
            shopify_price_rule_id: discountData.priceRuleId,
            shopify_discount_id: discountData.discountId,
            valid_until: discountData.expiresAt,
          })

        // Trigger email send
        const emailResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-cart-recovery-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            },
            body: JSON.stringify({
              abandonedCartId: abandonedCart.id,
            }),
          }
        )

        results.push({
          userId: session.user_id,
          cartValue: session.cart_value,
          discountCode: discountData.code,
          emailSent: emailResponse.ok,
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Abandoned carts processed', 
        count: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error detecting abandoned carts:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})