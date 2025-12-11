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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    console.log('Registering affiliate for user:', user.id)

    // Check if user already has an affiliate account
    const { data: existingAffiliate } = await supabaseAdmin
      .from('fan_affiliates')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingAffiliate) {
      console.log('User already has affiliate account:', existingAffiliate.affiliate_code)
      return new Response(
        JSON.stringify({ 
          success: true, 
          affiliate: existingAffiliate,
          message: 'Already registered as affiliate'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's display name for code generation
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single()

    const displayName = profile?.display_name || user.email?.split('@')[0] || 'FAN'

    // Generate unique affiliate code
    const { data: codeResult, error: codeError } = await supabaseAdmin
      .rpc('generate_affiliate_code', { display_name: displayName })

    if (codeError) {
      console.error('Error generating affiliate code:', codeError)
      throw new Error('Failed to generate affiliate code')
    }

    const affiliateCode = codeResult as string
    console.log('Generated affiliate code:', affiliateCode)

    // Create Shopify discount code for this affiliate
    let shopifyDiscountCode = null
    let shopifyPriceRuleId = null

    const SHOPIFY_DOMAIN = Deno.env.get('SHOPIFY_STORE_PERMANENT_DOMAIN')
    const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ACCESS_TOKEN')

    if (SHOPIFY_DOMAIN && SHOPIFY_ACCESS_TOKEN) {
      try {
        console.log('Creating Shopify discount for affiliate')
        
        // Create a permanent 10% discount price rule for this affiliate
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
                title: `Affiliate ${affiliateCode}`,
                target_type: 'line_item',
                target_selection: 'all',
                allocation_method: 'across',
                value_type: 'percentage',
                value: '-10.0',
                customer_selection: 'all',
                starts_at: new Date().toISOString(),
                usage_limit: null, // Unlimited uses
              },
            }),
          }
        )

        if (priceRuleResponse.ok) {
          const priceRuleData = await priceRuleResponse.json()
          shopifyPriceRuleId = priceRuleData.price_rule.id.toString()

          // Create the discount code
          const discountResponse = await fetch(
            `https://${SHOPIFY_DOMAIN}/admin/api/2025-07/price_rules/${shopifyPriceRuleId}/discount_codes.json`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
              },
              body: JSON.stringify({
                discount_code: {
                  code: affiliateCode,
                },
              }),
            }
          )

          if (discountResponse.ok) {
            shopifyDiscountCode = affiliateCode
            console.log('Shopify discount code created:', shopifyDiscountCode)
          } else {
            console.error('Failed to create Shopify discount code:', await discountResponse.text())
          }
        } else {
          console.error('Failed to create Shopify price rule:', await priceRuleResponse.text())
        }
      } catch (shopifyError) {
        console.error('Shopify integration error:', shopifyError)
        // Continue without Shopify integration
      }
    } else {
      console.log('Shopify credentials not configured, skipping Shopify discount creation')
    }

    // Create the affiliate record
    const { data: affiliate, error: insertError } = await supabaseAdmin
      .from('fan_affiliates')
      .insert({
        user_id: user.id,
        affiliate_code: affiliateCode,
        shopify_discount_code: shopifyDiscountCode,
        shopify_price_rule_id: shopifyPriceRuleId,
        status: 'active',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating affiliate record:', insertError)
      throw new Error('Failed to create affiliate account')
    }

    console.log('Affiliate registered successfully:', affiliate.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        affiliate,
        message: 'Affiliate account created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in affiliate-register:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
