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
    const { location, user_id } = await req.json()

    if (!location) {
      throw new Error('Location is required')
    }

    // Use OpenStreetMap Nominatim for geocoding (free, no API key needed)
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
    
    const response = await fetch(geocodeUrl, {
      headers: {
        'User-Agent': 'SonsOfLegion-Fan-Map/1.0'
      }
    })

    const data = await response.json()

    if (!data || data.length === 0) {
      throw new Error('Location not found')
    }

    const { lat, lon } = data[0]

    // If user_id provided, update their coordinates
    if (user_id) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      )

      const { error } = await supabaseClient.rpc('update_user_coordinates', {
        p_user_id: user_id,
        p_latitude: parseFloat(lat),
        p_longitude: parseFloat(lon)
      })

      if (error) throw error
    }

    return new Response(
      JSON.stringify({ 
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        location
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      },
    )
  } catch (err) {
    const error = err as Error;
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      },
    )
  }
})