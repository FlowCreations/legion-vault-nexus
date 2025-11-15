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
    const { goalDescription, eventLocation } = await req.json();
    console.log('Analyzing audience for goal:', goalDescription);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract location coordinates (simplified - in production use geocoding API)
    const locationCoords: { [key: string]: { lat: number; lng: number } } = {
      'nyc': { lat: 40.7128, lng: -74.0060 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      'los angeles': { lat: 34.0522, lng: -118.2437 },
      'la': { lat: 34.0522, lng: -118.2437 },
      'chicago': { lat: 41.8781, lng: -87.6298 },
      'miami': { lat: 25.7617, lng: -80.1918 },
      'austin': { lat: 30.2672, lng: -97.7431 },
    };

    const eventCity = eventLocation?.toLowerCase() || 
                      Object.keys(locationCoords).find(city => 
                        goalDescription.toLowerCase().includes(city)
                      ) || 'nyc';

    const eventCoords = locationCoords[eventCity] || locationCoords['nyc'];

    // Haversine distance calculation
    function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }

    // Fetch all users with their profiles and scores
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        email,
        first_name,
        latitude,
        longitude,
        total_spend,
        watch_time,
        listen_time,
        last_active_at,
        avatar_url
      `);

    if (usersError) throw usersError;

    // Fetch PTP/ERA scores
    const { data: scores } = await supabase
      .from('era_ptp_scores_daily')
      .select('member_id, ptp, era')
      .order('score_date', { ascending: false });

    const scoreMap = new Map(scores?.map(s => [s.member_id, s]) || []);

    // Check for traveling users (recent IP location different from home)
    const { data: recentEvents } = await supabase
      .from('events')
      .select('member_id, location, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    const travelingUsers = new Set<string>();
    const userLastLocation = new Map<string, string>();
    
    recentEvents?.forEach(event => {
      if (event.location && event.location.toLowerCase().includes(eventCity)) {
        travelingUsers.add(event.member_id);
      }
      if (!userLastLocation.has(event.member_id) && event.location) {
        userLastLocation.set(event.member_id, event.location);
      }
    });

    // Score each user
    const scoredUsers = users?.map(user => {
      const userScore = scoreMap.get(user.user_id);
      const ptp = userScore?.ptp || 0;
      const era = userScore?.era || 0;

      let score = 0;
      const details: any = {};

      // Location score (40% weight)
      if (user.latitude && user.longitude) {
        const distance = calculateDistance(
          user.latitude,
          user.longitude,
          eventCoords.lat,
          eventCoords.lng
        );
        details.distance = Math.round(distance);

        if (distance < 50) score += 40;
        else if (distance < 100) score += 30;
        else if (distance < 150) score += 20;
        else if (distance < 200) score += 10;
      }

      // Traveling bonus
      if (travelingUsers.has(user.user_id)) {
        score += 15;
        details.traveling = true;
      }

      // PTP Score (30% weight) - yellow to green zone
      if (ptp >= 40 && ptp <= 60) {
        score += 30; // Yellow zone - needs nudge
        details.ptpZone = 'yellow';
      } else if (ptp > 60 && ptp <= 80) {
        score += 25; // Green zone
        details.ptpZone = 'green';
      } else if (ptp > 80) {
        score += 20; // Already loyal
        details.ptpZone = 'loyal';
      }

      // Loyalty (20% weight)
      const purchases = user.total_spend ? Math.floor(user.total_spend / 50) : 0;
      if (purchases > 3) score += 20;
      else if (purchases > 1) score += 15;
      else if (user.watch_time || user.listen_time) score += 10;

      details.purchases = purchases;

      // Recency (10% weight)
      if (user.last_active_at) {
        const daysSinceActive = (Date.now() - new Date(user.last_active_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceActive <= 7) score += 10;
        else if (daysSinceActive <= 30) score += 5;
        details.daysSinceActive = Math.round(daysSinceActive);
      }

      return {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        avatar_url: user.avatar_url,
        score,
        ptp,
        era,
        details
      };
    }).filter(u => u.score > 20) || []; // Only users with meaningful score

    // Sort by score
    scoredUsers.sort((a, b) => b.score - a.score);

    // Calculate stats
    const stats = {
      totalMatches: scoredUsers.length,
      nearbyUsers: scoredUsers.filter(u => u.details.distance && u.details.distance < 120).length,
      highPtpUsers: scoredUsers.filter(u => u.details.ptpZone === 'yellow' || u.details.ptpZone === 'green').length,
      loyalFans: scoredUsers.filter(u => u.details.purchases > 2).length,
      travelingUsers: scoredUsers.filter(u => u.details.traveling).length,
      estimatedRevenue: scoredUsers.length * 70.5 // avg ticket price estimate
    };

    console.log('Audience analysis complete:', stats);

    return new Response(
      JSON.stringify({
        targetUsers: scoredUsers.slice(0, 500), // Top 500 matches
        stats,
        eventCity,
        eventCoords
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error analyzing audience:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
