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
    const { discount_percentage, userId } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get settings for code validity
    const { data: settings } = await supabaseClient
      .from('abandoned_cart_settings')
      .select('code_validity_days')
      .single()

    const codeValidityDays = settings?.code_validity_days || 7
    
    const SHOPIFY_DOMAIN = Deno.env.get('SHOPIFY_STORE_PERMANENT_DOMAIN')
    const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ACCESS_TOKEN')
    
    if (!SHOPIFY_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
      throw new Error('Missing Shopify credentials')
    }

    // Generate unique code
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase()
    const discountCode = `COMEBACK${discount_percentage}-${randomString}`

    // Calculate expiration date based on settings
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + codeValidityDays)
    
    // Create Price Rule
    const priceRuleResponse = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/2025-07/price_rules.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          price_rule: {
            title: `Cart Recovery ${userId || 'Guest'}`,
            target_type: 'line_item',
            target_selection: 'all',
            allocation_method: 'across',
            value_type: 'percentage',
            value: `-${discount_percentage}.0`,
            customer_selection: 'all',
            starts_at: new Date().toISOString(),
            ends_at: expiresAt.toISOString(),
            usage_limit: 1,
          },
        }),
      }
    )

    if (!priceRuleResponse.ok) {
      const error = await priceRuleResponse.text()
      throw new Error(`Failed to create price rule: ${error}`)
    }

    const priceRuleData = await priceRuleResponse.json()
    const priceRuleId = priceRuleData.price_rule.id

    // Create Discount Code
    const discountResponse = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/2025-07/price_rules/${priceRuleId}/discount_codes.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          discount_code: {
            code: discountCode,
          },
        }),
      }
    )

    if (!discountResponse.ok) {
      const error = await discountResponse.text()
      throw new Error(`Failed to create discount code: ${error}`)
    }

    const discountData = await discountResponse.json()

    return new Response(
      JSON.stringify({
        code: discountCode,
        priceRuleId: priceRuleId.toString(),
        discountId: discountData.discount_code.id.toString(),
        expiresAt: priceRuleData.price_rule.ends_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating discount:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
