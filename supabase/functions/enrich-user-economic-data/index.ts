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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, enrich_all } = await req.json();

    if (enrich_all) {
      // Enrich all users with phone numbers
      const { data: users } = await supabaseClient
        .from('user_profiles')
        .select('user_id, phone_number, allow_economic_profiling')
        .not('phone_number', 'is', null)
        .eq('allow_economic_profiling', true);

      let enriched = 0;
      let failed = 0;

      for (const user of users || []) {
        try {
          await enrichUserData(supabaseClient, user.user_id, user.phone_number);
          enriched++;
        } catch (error) {
          console.error(`Failed to enrich user ${user.user_id}:`, error);
          failed++;
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          enriched, 
          failed,
          total: (users || []).length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (user_id) {
      // Enrich single user
      const { data: profile } = await supabaseClient
        .from('user_profiles')
        .select('phone_number, allow_economic_profiling')
        .eq('user_id', user_id)
        .single();

      if (!profile?.phone_number) {
        return new Response(
          JSON.stringify({ error: 'No phone number found for user' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!profile.allow_economic_profiling) {
        return new Response(
          JSON.stringify({ error: 'User has opted out of economic profiling' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await enrichUserData(supabaseClient, user_id, profile.phone_number);

      return new Response(
        JSON.stringify({ success: true, ...result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'user_id or enrich_all required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function enrichUserData(supabaseClient: any, userId: string, phoneNumber: string) {
  // Extract area code from phone number (assuming US format: +1XXXXXXXXXX or 1XXXXXXXXXX or XXXXXXXXXX)
  const cleaned = phoneNumber.replace(/\D/g, '');
  let areaCode: string;
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    areaCode = cleaned.substring(1, 4);
  } else if (cleaned.length === 10) {
    areaCode = cleaned.substring(0, 3);
  } else {
    console.warn(`Invalid phone number format for user ${userId}: ${phoneNumber}`);
    return { warning: 'Invalid phone number format' };
  }

  console.log(`Extracted area code ${areaCode} for user ${userId}`);

  // Look up economic data by area code
  const { data: geoData, error: geoError } = await supabaseClient
    .from('geographic_economic_data')
    .select('*')
    .eq('area_code', areaCode)
    .single();

  if (geoError || !geoData) {
    console.warn(`No economic data found for area code ${areaCode}`);
    // Still update with area code even if no data found
    await supabaseClient
      .from('user_profiles')
      .update({ area_code: areaCode })
      .eq('user_id', userId);
    
    return { 
      area_code: areaCode,
      warning: 'No economic data available for this area code'
    };
  }

  // Calculate purchasing power score (0-100)
  // Formula: (median_income / national_median) * (100 / cost_of_living_index) * 100
  const nationalMedianIncome = 74580; // US median household income 2023
  const purchasingPowerScore = Math.min(100, Math.round(
    (geoData.median_household_income / nationalMedianIncome) * 
    (100 / geoData.cost_of_living_index) * 
    100
  ));

  // Determine economic segment based on purchasing power
  let economicSegment: string;
  if (purchasingPowerScore >= 76) {
    economicSegment = 'luxury';
  } else if (purchasingPowerScore >= 51) {
    economicSegment = 'premium';
  } else if (purchasingPowerScore >= 26) {
    economicSegment = 'moderate';
  } else {
    economicSegment = 'budget';
  }

  // Update user profile with enriched data
  const { error: updateError } = await supabaseClient
    .from('user_profiles')
    .update({
      area_code: areaCode,
      estimated_household_income: geoData.median_household_income,
      purchasing_power_score: purchasingPowerScore,
      economic_segment: economicSegment,
      location: geoData.city && geoData.state ? `${geoData.city}, ${geoData.state}` : null
    })
    .eq('user_id', userId);

  if (updateError) {
    throw updateError;
  }

  console.log(`Successfully enriched user ${userId} with economic data from ${geoData.city}, ${geoData.state}`);

  return {
    area_code: areaCode,
    city: geoData.city,
    state: geoData.state,
    estimated_income: geoData.median_household_income,
    purchasing_power_score: purchasingPowerScore,
    economic_segment: economicSegment,
    cost_of_living_index: geoData.cost_of_living_index,
    urban_classification: geoData.urban_rural_classification
  };
}
