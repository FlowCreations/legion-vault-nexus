import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaydayAnalysisResult {
  userId: string;
  detected: boolean;
  primaryPayday: number | null;
  secondaryPayday: number | null;
  confidence: number;
  payrollCycle: string;
  sampleSize: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, analyzeAll } = await req.json();

    if (analyzeAll) {
      // Analyze all users with purchases
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .not('total_spend', 'is', null);

      if (usersError) throw usersError;

      const results: PaydayAnalysisResult[] = [];
      for (const user of users || []) {
        const result = await analyzeUserPaydayPattern(supabase, user.user_id);
        if (result) results.push(result);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          analyzed: results.length,
          results: results.filter(r => r.detected)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (userId) {
      // Analyze single user
      const result = await analyzeUserPaydayPattern(supabase, userId);
      return new Response(
        JSON.stringify({ success: true, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('Either userId or analyzeAll must be provided');
    }
  } catch (error) {
    console.error('Error analyzing payday patterns:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function analyzeUserPaydayPattern(
  supabase: any,
  userId: string
): Promise<PaydayAnalysisResult | null> {
  // Fetch purchases from last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: purchases, error } = await supabase
    .from('purchases')
    .select('created_at, amount_total')
    .eq('user_id', userId)
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Error fetching purchases for user ${userId}:`, error);
    return null;
  }

  if (!purchases || purchases.length < 3) {
    // Not enough data to detect pattern
    return {
      userId,
      detected: false,
      primaryPayday: null,
      secondaryPayday: null,
      confidence: 0,
      payrollCycle: 'irregular',
      sampleSize: purchases?.length || 0
    };
  }

  // Count purchases by day of month
  const dayCount: Record<number, number> = {};
  purchases.forEach((p: any) => {
    const day = new Date(p.created_at).getDate();
    dayCount[day] = (dayCount[day] || 0) + 1;
  });

  // Find primary peak (most frequent day)
  const sortedDays = Object.entries(dayCount)
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  
  if (sortedDays.length === 0) {
    return {
      userId,
      detected: false,
      primaryPayday: null,
      secondaryPayday: null,
      confidence: 0,
      payrollCycle: 'irregular',
      sampleSize: purchases.length
    };
  }

  const primaryDay = parseInt(sortedDays[0][0]);
  const primaryCount = Number(sortedDays[0][1]);

  // Check for biweekly pattern (second peak ~14 days away)
  const secondaryPeak = sortedDays
    .slice(1)
    .find(([day, count]) => {
      const diff = Math.abs(parseInt(day) - primaryDay);
      return (diff >= 12 && diff <= 16) && Number(count) >= 2;
    });

  // Calculate confidence score
  const confidence = Math.min(100, (primaryCount / purchases.length) * 100);

  // Determine payroll cycle
  let cycleType = 'irregular';
  if (confidence >= 40) cycleType = 'monthly';
  if (secondaryPeak && Number(secondaryPeak[1]) >= 2) cycleType = 'biweekly';

  const secondaryDay = secondaryPeak ? parseInt(secondaryPeak[0]) : null;

  // Build payday pattern object
  const paydayPattern = {
    detected: confidence >= 40,
    primary_payday: primaryDay,
    secondary_payday: secondaryDay,
    purchase_count_by_day: dayCount,
    analysis_date: new Date().toISOString(),
    sample_size: purchases.length
  };

  // Update user profile
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({
      payday_pattern: paydayPattern,
      likely_payday_dates: secondaryDay ? [primaryDay, secondaryDay] : [primaryDay],
      payday_confidence_score: confidence,
      payroll_cycle_type: cycleType,
      last_payday_analysis: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error(`Error updating user ${userId}:`, updateError);
  }

  return {
    userId,
    detected: confidence >= 40,
    primaryPayday: primaryDay,
    secondaryPayday: secondaryDay,
    confidence: Math.round(confidence),
    payrollCycle: cycleType,
    sampleSize: purchases.length
  };
}
