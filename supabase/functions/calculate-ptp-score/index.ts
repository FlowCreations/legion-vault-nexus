import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PTPFactors {
  engagement_score: number;
  recency_score: number;
  frequency_score: number;
  monetary_score: number;
  loyalty_score: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('userId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Calculating PTP score for user:', userId);

    // Fetch user profile and activity data
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      throw profileError;
    }

    // Fetch user events for analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('member_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (eventsError) {
      throw eventsError;
    }

    // Calculate PTP factors
    const factors = calculatePTPFactors(profile, events || []);
    
    // Calculate final PTP score (0-100)
    const ptpScore = Math.round(
      (factors.engagement_score * 0.25) +
      (factors.recency_score * 0.20) +
      (factors.frequency_score * 0.20) +
      (factors.monetary_score * 0.20) +
      (factors.loyalty_score * 0.15)
    );

    // Determine PTP status
    let ptpStatus: 'red' | 'yellow' | 'green';
    if (ptpScore >= 70) {
      ptpStatus = 'green';
    } else if (ptpScore >= 40) {
      ptpStatus = 'yellow';
    } else {
      ptpStatus = 'red';
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        ptp_score: ptpScore,
        ptp_status: ptpStatus,
        last_ptp_calculation: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      throw updateError;
    }

    // Insert into history
    const { error: historyError } = await supabase
      .from('ptp_score_history')
      .insert({
        user_id: userId,
        score: ptpScore,
        status: ptpStatus,
        contributing_factors: factors
      });

    if (historyError) {
      throw historyError;
    }

    console.log(`PTP score calculated: ${ptpScore} (${ptpStatus}) for user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        ptpScore,
        ptpStatus,
        factors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error calculating PTP score:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculatePTPFactors(profile: any, events: any[]): PTPFactors {
  // Engagement score (0-100) - based on total activity
  const totalEvents = events.length;
  const engagement_score = Math.min(100, totalEvents * 5); // 20 events = 100

  // Recency score (0-100) - how recent was last activity
  const lastActivity = profile.last_active_at ? new Date(profile.last_active_at) : null;
  let recency_score = 0;
  if (lastActivity) {
    const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceActivity <= 1) recency_score = 100;
    else if (daysSinceActivity <= 3) recency_score = 80;
    else if (daysSinceActivity <= 7) recency_score = 60;
    else if (daysSinceActivity <= 14) recency_score = 40;
    else if (daysSinceActivity <= 30) recency_score = 20;
    else recency_score = 0;
  }

  // Frequency score (0-100) - events per week
  const eventsPerWeek = totalEvents / 4.3; // 30 days ≈ 4.3 weeks
  const frequency_score = Math.min(100, eventsPerWeek * 10); // 10 events/week = 100

  // Monetary score (0-100) - based on tier and purchases
  let monetary_score = 0;
  const tier = (profile.membership_tier || profile.tier || 'free').toLowerCase();
  if (tier.includes('legionnaire')) monetary_score = 100;
  else if (tier.includes('outlaw')) monetary_score = 75;
  else if (tier.includes('rebel')) monetary_score = 50;
  else monetary_score = 25;

  // Loyalty score (0-100) - time as member + consistency
  const memberSince = profile.created_at ? new Date(profile.created_at) : new Date();
  const daysMember = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24));
  let loyalty_score = Math.min(80, daysMember / 3.65); // 1 year = 80 points
  
  // Bonus for consistent engagement
  if (eventsPerWeek > 2) loyalty_score = Math.min(100, loyalty_score + 20);

  return {
    engagement_score,
    recency_score,
    frequency_score,
    monetary_score,
    loyalty_score
  };
}
