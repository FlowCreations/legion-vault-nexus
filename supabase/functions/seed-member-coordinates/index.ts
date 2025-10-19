import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Geocoding helper function using OpenStreetMap
async function geocodeLocation(location: string) {
  try {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
    const response = await fetch(geocodeUrl, {
      headers: { 'User-Agent': 'SonsOfLegion-Fan-Map/1.0' }
    })
    const data = await response.json()
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      }
    }
  } catch (err) {
    console.error(`Failed to geocode ${location}:`, err)
  }
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Starting to seed demo member coordinates...')

    // Fetch all user profiles that have a location but no coordinates
    const { data: profiles, error: fetchError } = await supabaseClient
      .from('user_profiles')
      .select('user_id, display_name, location, latitude, longitude')
      .not('location', 'is', null)
      .is('latitude', null)

    if (fetchError) throw fetchError

    console.log(`Found ${profiles?.length || 0} profiles needing coordinates`)

    let geocodedCount = 0
    
    // Geocode each profile's location
    for (const profile of profiles || []) {
      if (profile.location) {
        console.log(`Geocoding ${profile.display_name} in ${profile.location}...`)
        const coords = await geocodeLocation(profile.location)
        
        if (coords) {
          const { error: updateError } = await supabaseClient
            .from('user_profiles')
            .update({
              latitude: coords.latitude,
              longitude: coords.longitude,
              is_public: true // Make public by default
            })
            .eq('user_id', profile.user_id)

          if (!updateError) {
            geocodedCount++
            console.log(`✓ Updated ${profile.display_name}: ${coords.latitude}, ${coords.longitude}`)
          } else {
            console.error(`Failed to update ${profile.display_name}:`, updateError)
          }
          
          // Rate limiting - wait 1 second between requests to be respectful to Nominatim
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Geocoded ${geocodedCount} member locations`,
        total_profiles: profiles?.length || 0,
        geocoded: geocodedCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      },
    )
  } catch (err) {
    const error = err as Error
    console.error('Error seeding coordinates:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      },
    )
  }
})