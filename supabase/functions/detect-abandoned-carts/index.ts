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

    // Get settings
    const { data: settings } = await supabaseClient
      .from('abandoned_cart_settings')
      .select('*')
      .single()

    const delayDays = settings?.delay_days || 3
    const minCartValue = settings?.min_cart_value || 20
    const discountPercentage = settings?.discount_percentage || 25

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

    // Find carts abandoned based on settings
    const cutoffDate = new Date(Date.now() - delayDays * 24 * 60 * 60 * 1000)
    
    const { data: abandonedSessions } = await supabaseClient
      .from('cart_sessions')
      .select('*')
      .lt('last_updated', cutoffDate.toISOString())
      .gte('cart_value', minCartValue)

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
            discount_percentage: discountPercentage,
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
          discount_percentage: discountPercentage,
          expires_at: discountData.expiresAt,
        })
        .select()
        .single()

      if (abandonedCart) {
        // Send recovery email
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

        if (emailResponse.ok) {
          results.push({
            userId: session.user_id,
            cartValue: session.cart_value,
            discountCode: discountData.code,
            emailSent: true,
          })
        } else {
          results.push({
            userId: session.user_id,
            cartValue: session.cart_value,
            discountCode: discountData.code,
            emailSent: false,
            error: 'Failed to send email',
          })
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Abandoned cart detection complete',
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
