import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Reward percentages by trigger type
const REWARD_PERCENTAGES: Record<string, number> = {
  'signup': 10,
  'digital_purchase': 15,
  'subscription': 25,
  'merch_purchase': 15,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      affiliate_code,
      trigger_type,
      converted_user_id,
      visitor_jrny_id,
      visitor_session_id,
      purchase_value,
      product_info
    } = await req.json()

    if (!affiliate_code) {
      throw new Error('Affiliate code is required')
    }

    if (!trigger_type || !Object.keys(REWARD_PERCENTAGES).includes(trigger_type)) {
      throw new Error('Valid trigger_type is required')
    }

    console.log('Processing conversion for affiliate:', affiliate_code, 'trigger:', trigger_type)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find the affiliate
    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from('fan_affiliates')
      .select('*')
      .eq('affiliate_code', affiliate_code.toUpperCase())
      .single()

    if (affiliateError || !affiliate) {
      console.error('Affiliate not found:', affiliate_code)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid affiliate code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Don't let affiliates refer themselves
    if (converted_user_id && converted_user_id === affiliate.user_id) {
      console.log('Self-referral blocked for affiliate:', affiliate_code)
      return new Response(
        JSON.stringify({ success: false, error: 'Self-referrals not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark the click as converted if we can find it
    if (visitor_jrny_id || visitor_session_id) {
      const clickQuery = supabaseAdmin
        .from('affiliate_referral_clicks')
        .update({ 
          converted: true, 
          converted_at: new Date().toISOString() 
        })
        .eq('affiliate_id', affiliate.id)
        .eq('converted', false)
      
      if (visitor_jrny_id) {
        clickQuery.eq('visitor_jrny_id', visitor_jrny_id)
      } else if (visitor_session_id) {
        clickQuery.eq('visitor_session_id', visitor_session_id)
      }

      await clickQuery
    }

    // Update affiliate stats based on trigger type
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    switch (trigger_type) {
      case 'signup':
        updateData.portal_signups = affiliate.portal_signups + 1
        break
      case 'digital_purchase':
        updateData.digital_purchases = affiliate.digital_purchases + 1
        break
      case 'subscription':
        updateData.portal_signups = affiliate.portal_signups + 1
        break
      case 'merch_purchase':
        updateData.merch_purchases = affiliate.merch_purchases + 1
        break
    }

    // Create reward discount code via Shopify API
    const discountPercentage = REWARD_PERCENTAGES[trigger_type]
    let rewardCode = null
    let shopifyPriceRuleId = null

    const SHOPIFY_DOMAIN = Deno.env.get('SHOPIFY_STORE_PERMANENT_DOMAIN')
    const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ACCESS_TOKEN')

    if (SHOPIFY_DOMAIN && SHOPIFY_ACCESS_TOKEN) {
      try {
        // Create a one-time use discount for this reward
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30) // 30 day expiry

        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
        rewardCode = `SOL${discountPercentage}-${randomSuffix}`

        console.log('Creating Shopify reward code:', rewardCode)

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
                title: `Affiliate Reward ${rewardCode}`,
                target_type: 'line_item',
                target_selection: 'all',
                allocation_method: 'across',
                value_type: 'percentage',
                value: `-${discountPercentage}.0`,
                customer_selection: 'all',
                starts_at: new Date().toISOString(),
                ends_at: expiresAt.toISOString(),
                usage_limit: 1, // One-time use
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
                  code: rewardCode,
                },
              }),
            }
          )

          if (!discountResponse.ok) {
            console.error('Failed to create Shopify discount code:', await discountResponse.text())
            rewardCode = null
          } else {
            console.log('Shopify reward code created successfully')
          }
        } else {
          console.error('Failed to create Shopify price rule:', await priceRuleResponse.text())
          rewardCode = null
        }
      } catch (shopifyError) {
        console.error('Shopify integration error:', shopifyError)
        rewardCode = null
      }
    }

    // If Shopify failed, create a portal-only code
    if (!rewardCode) {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
      rewardCode = `PORTAL${discountPercentage}-${randomSuffix}`
    }

    // Create the reward record
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { error: rewardError } = await supabaseAdmin
      .from('affiliate_rewards')
      .insert({
        affiliate_id: affiliate.id,
        trigger_type,
        discount_code: rewardCode,
        discount_percentage: discountPercentage,
        reward_type: shopifyPriceRuleId ? 'shopify_code' : 'portal_credit',
        shopify_price_rule_id: shopifyPriceRuleId,
        expires_at: expiresAt.toISOString(),
      })

    if (rewardError) {
      console.error('Error creating reward:', rewardError)
    } else {
      updateData.discount_codes_earned = affiliate.discount_codes_earned + 1
    }

    // Update affiliate stats
    const { error: updateError } = await supabaseAdmin
      .from('fan_affiliates')
      .update(updateData)
      .eq('id', affiliate.id)

    if (updateError) {
      console.error('Error updating affiliate stats:', updateError)
    }

    console.log('Conversion processed successfully:', {
      affiliate_code,
      trigger_type,
      reward_code: rewardCode,
      discount_percentage: discountPercentage
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        reward: {
          code: rewardCode,
          percentage: discountPercentage,
          expires_at: expiresAt.toISOString()
        },
        message: 'Conversion attributed and reward created'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in affiliate-attribute-conversion:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
