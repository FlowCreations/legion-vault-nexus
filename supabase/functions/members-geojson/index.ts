import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    console.log('🔍 Fetching user profiles with coordinates...')

    // Fetch all user profiles that have valid coordinates with comprehensive data
    const { data: profiles, error } = await supabaseClient
      .from('user_profiles')
      .select(`
        user_id, display_name, avatar_url, location, latitude, longitude, tier, membership_tier, created_at,
        watch_time, listen_time, livestream_engagement_score, livestream_reaction_count,
        community_engagement_score, login_streak, total_sessions, last_active_at,
        total_spend, mrr, purchase_count, favorite_count,
        era_label, ptp_status, ptp_current, is_super_fan
      `)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (error) {
      console.error('❌ Database error:', error)
      throw error
    }

    console.log(`✅ Found ${profiles?.length || 0} profiles with coordinates`)

    // Convert to GeoJSON format
    const geojson = {
      type: 'FeatureCollection',
      features: (profiles || []).map((profile) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [Number(profile.longitude), Number(profile.latitude)]
        },
        properties: {
          user_id: profile.user_id,
          name: profile.display_name || 'Community Member',
          avatar_url: profile.avatar_url || '',
          location: profile.location || '',
          tier: profile.tier || 'free',
          joined_at: profile.created_at,
          profile_url: `/community/${profile.user_id}`,
          watch_time: profile.watch_time || 0,
          listen_time: profile.listen_time || 0,
          livestream_engagement_score: profile.livestream_engagement_score || 0,
          livestream_reaction_count: profile.livestream_reaction_count || 0,
          community_engagement_score: profile.community_engagement_score || 0,
          login_streak: profile.login_streak || 0,
          total_sessions: profile.total_sessions || 0,
          last_active_at: profile.last_active_at,
          total_spend: profile.total_spend || 0,
          mrr: profile.mrr || 0,
          era_label: profile.era_label || '',
          ptp_status: profile.ptp_status || false,
          ptp_current: profile.ptp_current ?? 50, // Default to 50 (mid-range) if null
          ptpScore: profile.ptp_current ?? 50, // Default to 50 for map coloring
          is_super_fan: profile.is_super_fan || false,
        }
      }))
    }

    console.log(`🌍 Returning GeoJSON with ${geojson.features.length} features`)

    return new Response(
      JSON.stringify(geojson),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=300' // Cache for 5 minutes
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
