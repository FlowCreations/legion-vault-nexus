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

    // Fetch all user profiles that have valid coordinates
    const { data: profiles, error } = await supabaseClient
      .from('user_profiles')
      .select('user_id, display_name, avatar_url, location, latitude, longitude, tier, created_at')
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
        }
      }))
    }

    console.log(`🌍 Returning GeoJSON with ${geojson.features.length} features`)

    return new Response(
      JSON.stringify(geojson),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
