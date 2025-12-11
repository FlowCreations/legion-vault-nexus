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
    const { 
      affiliate_code, 
      link_type, 
      visitor_jrny_id, 
      visitor_session_id,
      landing_page,
      referrer_url,
      user_agent,
      source_platform
    } = await req.json()

    if (!affiliate_code) {
      throw new Error('Affiliate code is required')
    }

    if (!link_type || !['portal', 'music', 'merch'].includes(link_type)) {
      throw new Error('Valid link_type is required (portal, music, or merch)')
    }

    console.log('Tracking click for affiliate:', affiliate_code, 'link_type:', link_type)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find the affiliate by code
    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from('fan_affiliates')
      .select('id, user_id, status')
      .eq('affiliate_code', affiliate_code.toUpperCase())
      .single()

    if (affiliateError || !affiliate) {
      console.error('Affiliate not found:', affiliate_code)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid affiliate code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (affiliate.status !== 'active') {
      console.log('Affiliate is not active:', affiliate_code)
      return new Response(
        JSON.stringify({ success: false, error: 'Affiliate is not active' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Detect source platform from referrer if not provided
    let detectedPlatform = source_platform
    if (!detectedPlatform && referrer_url) {
      const refLower = referrer_url.toLowerCase()
      if (refLower.includes('instagram')) detectedPlatform = 'instagram'
      else if (refLower.includes('tiktok')) detectedPlatform = 'tiktok'
      else if (refLower.includes('facebook') || refLower.includes('fb.')) detectedPlatform = 'facebook'
      else if (refLower.includes('twitter') || refLower.includes('x.com')) detectedPlatform = 'twitter'
      else if (refLower.includes('youtube')) detectedPlatform = 'youtube'
      else if (refLower.includes('linkedin')) detectedPlatform = 'linkedin'
      else detectedPlatform = 'other'
    }

    // Record the click
    const { error: clickError } = await supabaseAdmin
      .from('affiliate_referral_clicks')
      .insert({
        affiliate_id: affiliate.id,
        visitor_jrny_id,
        visitor_session_id,
        link_type,
        source_platform: detectedPlatform,
        landing_page,
        referrer_url,
        user_agent,
      })

    if (clickError) {
      console.error('Error recording click:', clickError)
      throw new Error('Failed to record click')
    }

    // Update affiliate's total clicks using raw SQL increment
    const { error: updateError } = await supabaseAdmin
      .from('fan_affiliates')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', affiliate.id)

    // Increment total_clicks separately
    await supabaseAdmin
      .from('fan_affiliates')
      .select('total_clicks')
      .eq('id', affiliate.id)
      .single()
      .then(async ({ data }) => {
        if (data) {
          await supabaseAdmin
            .from('fan_affiliates')
            .update({ total_clicks: (data.total_clicks || 0) + 1 })
            .eq('id', affiliate.id)
        }
      })

    if (updateError) {
      console.error('Error updating affiliate:', updateError)
    }

    console.log('Click tracked successfully for affiliate:', affiliate_code)

    return new Response(
      JSON.stringify({ 
        success: true, 
        affiliate_id: affiliate.id,
        message: 'Click tracked'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in affiliate-track-click:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
