import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get IP address from request
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';

    console.log('Tracking location for user:', userId, 'IP:', ip);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's home location
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('latitude, longitude, location')
      .eq('user_id', userId)
      .single();

    let locationData: any = {
      ip,
      timestamp: new Date().toISOString(),
      is_traveling: false
    };

    // Only call IP geolocation API if we have a valid IP
    if (ip !== 'unknown' && !ip.startsWith('192.168') && !ip.startsWith('10.')) {
      try {
        // Use ipapi.co free tier (1000 requests/day)
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
        
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          
          locationData = {
            ...locationData,
            city: geoData.city,
            region: geoData.region,
            country: geoData.country_name,
            latitude: geoData.latitude,
            longitude: geoData.longitude,
            timezone: geoData.timezone
          };

          // Check if traveling (different city from home)
          if (profile?.location && geoData.city) {
            const homeCity = profile.location.toLowerCase();
            const currentCity = geoData.city.toLowerCase();
            locationData.is_traveling = !homeCity.includes(currentCity) && !currentCity.includes(homeCity);
            locationData.home_city = profile.location;
          }

          console.log('Location detected:', geoData.city, 'Traveling:', locationData.is_traveling);
        }
      } catch (geoError) {
        console.error('IP geolocation failed:', geoError);
        // Continue without geolocation data
      }
    }

    // Store location event
    const { error: eventError } = await supabase
      .from('events')
      .insert({
        member_id: userId,
        type: 'location_check',
        location: locationData.city || 'Unknown',
        meta: locationData
      });

    if (eventError) {
      console.error('Failed to store location event:', eventError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        location: locationData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error tracking location:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
