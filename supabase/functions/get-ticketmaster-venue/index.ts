import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TicketmasterVenue {
  id: string;
  name: string;
  url?: string;
  city?: { name: string };
  state?: { stateCode: string; name: string };
  country?: { countryCode: string; name: string };
  address?: { line1: string };
  postalCode?: string;
  location?: { latitude: string; longitude: string };
  images?: Array<{ url: string; width: number; height: number; ratio?: string }>;
  generalInfo?: { generalRule?: string; childRule?: string };
  parkingDetail?: string;
  accessibleSeatingDetail?: string;
  boxOfficeInfo?: { phoneNumberDetail?: string; openHoursDetail?: string };
  seatmap?: { staticUrl?: string };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { venue, city, stateCode } = await req.json();
    
    if (!venue) {
      return new Response(
        JSON.stringify({ error: 'Venue name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('TICKETMASTER_API_KEY');
    if (!apiKey) {
      console.error('TICKETMASTER_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Ticketmaster API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query
    const params = new URLSearchParams({
      apikey: apiKey,
      keyword: venue,
      size: '5',
    });

    if (city) {
      params.append('city', city);
    }
    if (stateCode) {
      params.append('stateCode', stateCode);
    }

    const searchUrl = `https://app.ticketmaster.com/discovery/v2/venues.json?${params.toString()}`;
    console.log('[Ticketmaster] Searching venues:', { venue, city, stateCode });

    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.error('[Ticketmaster] API error:', response.status, await response.text());
      return new Response(
        JSON.stringify({ error: 'Ticketmaster API error', status: response.status }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    if (!data._embedded?.venues || data._embedded.venues.length === 0) {
      console.log('[Ticketmaster] No venues found for:', venue);
      return new Response(
        JSON.stringify({ venues: [], message: 'No venues found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map venues to our format
    const venues = data._embedded.venues.map((v: TicketmasterVenue) => {
      // Get the best image (prefer 16_9 ratio, largest size)
      const bestImage = v.images
        ?.sort((a, b) => (b.width || 0) - (a.width || 0))
        .find(img => img.ratio === '16_9' || img.ratio === '4_3') 
        || v.images?.[0];

      // Build full address
      const addressParts = [
        v.address?.line1,
        v.city?.name,
        v.state?.stateCode,
        v.postalCode,
        v.country?.countryCode !== 'US' ? v.country?.name : undefined
      ].filter(Boolean);

      return {
        id: v.id,
        name: v.name,
        url: v.url,
        imageUrl: bestImage?.url,
        address: addressParts.join(', '),
        city: v.city?.name,
        state: v.state?.stateCode,
        stateFullName: v.state?.name,
        country: v.country?.countryCode,
        postalCode: v.postalCode,
        latitude: v.location?.latitude ? parseFloat(v.location.latitude) : null,
        longitude: v.location?.longitude ? parseFloat(v.location.longitude) : null,
        seatmapUrl: v.seatmap?.staticUrl,
        generalInfo: {
          generalRule: v.generalInfo?.generalRule,
          childRule: v.generalInfo?.childRule,
          parkingDetail: v.parkingDetail,
          accessibleSeating: v.accessibleSeatingDetail,
          boxOffice: v.boxOfficeInfo,
        },
      };
    });

    console.log('[Ticketmaster] Found', venues.length, 'venues');

    return new Response(
      JSON.stringify({ venues }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Ticketmaster] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
