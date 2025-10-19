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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Fetch all public user profiles with coordinates
    const { data: profiles, error } = await supabaseClient
      .from('user_profiles')
      .select('user_id, display_name, avatar_url, location, latitude, longitude, era_current, era_label, ptp_current, ptp_status, tier, created_at, is_public')
      .eq('is_public', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (error) throw error

    // Convert to GeoJSON FeatureCollection
    const features = profiles.map(profile => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(profile.longitude), parseFloat(profile.latitude)]
      },
      properties: {
        user_id: profile.user_id,
        name: profile.display_name,
        avatar_url: profile.avatar_url,
        location: profile.location,
        era: profile.era_current,
        era_label: profile.era_label,
        ptp: profile.ptp_current,
        ptp_status: profile.ptp_status,
        tier: profile.tier,
        joined_at: profile.created_at,
        profile_url: `/community?member=${profile.user_id}`
      }
    }))

    const geojson = {
      type: 'FeatureCollection',
      features
    }

    return new Response(
      JSON.stringify(geojson),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60' // Cache for 1 minute
        } 
      },
    )
  } catch (err) {
    const error = err as Error;
    console.error('Error generating GeoJSON:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      },
    )
  }
})